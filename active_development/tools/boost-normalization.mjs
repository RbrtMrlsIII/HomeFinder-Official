#!/usr/bin/env node
/**
 * Patch 45: read-only boost entitlement normalization audit.
 *
 * Input: JSON object keyed by UID, or an array of {uid, data} records.
 * No writes are performed. The output classifies each role slice as canonical,
 * legacy, mixed, invalid, or inactive and proposes the canonical numeric package.
 */
import fs from 'node:fs';

const ROMAN = Object.freeze({ I: 1, II: 2, III: 3, IV: 4, V: 5 });
const VALID = new Set([0, 1, 2, 3, 4, 5]);

export function normalizePackageValue(raw) {
  if (raw == null || raw === '' || raw === 'none') return 0;
  if (typeof raw === 'string' && ROMAN[raw] != null) return ROMAN[raw];
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const id = Math.trunc(n);
  return VALID.has(id) ? id : null;
}

export function auditRoleSlice(slice) {
  const s = slice && typeof slice === 'object' ? slice : {};
  const active = s.active === true;
  const hasPackage = s.package != null;
  const hasLevel = s.level != null;
  const packageId = hasPackage ? normalizePackageValue(s.package) : null;
  const levelId = hasLevel ? normalizePackageValue(s.level) : null;
  const ids = [packageId, levelId].filter(v => v != null);
  const distinct = [...new Set(ids)];

  let status = 'inactive';
  if (active) {
    if (!ids.length) status = 'missing-package';
    else if (distinct.length > 1) status = 'conflict';
    else if (hasPackage && typeof s.package === 'number' && !hasLevel) status = 'canonical';
    else if (hasPackage && typeof s.package === 'number' && hasLevel && levelId === packageId) status = 'canonical-with-redundant-level';
    else status = 'legacy-or-mixed';
  }

  return {
    active,
    status,
    packageId: distinct.length === 1 ? distinct[0] : null,
    rawPackage: s.package ?? null,
    rawLevel: s.level ?? null,
    recommendWrite: active && distinct.length === 1 && status !== 'canonical'
      ? { active: true, package: distinct[0] }
      : null
  };
}

export function auditBoostDocument(uid, data) {
  const d = data && typeof data === 'object' ? data : {};
  const roles = {};
  for (const role of ['seeker', 'owner']) roles[role] = auditRoleSlice(d[role]);
  return { uid, roles };
}

export function auditExport(input) {
  const records = Array.isArray(input)
    ? input
    : Object.entries(input || {}).map(([uid, data]) => ({ uid, data }));
  return records.map(r => auditBoostDocument(String(r.uid || ''), r.data));
}

if (process.argv[1] && process.argv[1].endsWith('boost-normalization.mjs')) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node tools/boost-normalization.mjs <boost-export.json>');
    process.exit(2);
  }
  const input = JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = auditExport(input);
  console.log(JSON.stringify({ patch: 45, mode: 'read-only-audit', records: result }, null, 2));
}
