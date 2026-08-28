#!/usr/bin/env node
/**
 * Patch 47: Boost Migration Proof & Parser Retirement Gate.
 *
 * Read-only. Compares two Firestore-export-shaped JSON snapshots and proves
 * whether active boost records are canonical after a proposed migration.
 * NEVER writes Firestore and NEVER edits either snapshot.
 */
import fs from 'node:fs';

const ROLES = ['seeker', 'owner'];
const ROMAN = new Set(['I', 'II', 'III', 'IV', 'V']);

function records(input) {
  if (Array.isArray(input)) return input.map(r => ({ uid: String(r.uid || ''), data: r.data || {} }));
  return Object.entries(input || {}).map(([uid, data]) => ({ uid, data: data || {} }));
}

function isActive(slice) {
  return !!slice && typeof slice === 'object' && slice.active === true;
}

function isCanonical(slice) {
  return isActive(slice)
    && typeof slice.package === 'number'
    && Number.isInteger(slice.package)
    && slice.package >= 0
    && slice.package <= 5
    && slice.level == null;
}

function hasLegacyFields(slice) {
  if (!slice || typeof slice !== 'object') return false;
  return ROMAN.has(slice.package) || slice.level != null;
}

export function proveMigration(beforeInput, afterInput) {
  const before = new Map(records(beforeInput).map(r => [r.uid, r.data]));
  const after = new Map(records(afterInput).map(r => [r.uid, r.data]));
  const uids = [...new Set([...before.keys(), ...after.keys()])].sort();

  const rows = [];
  for (const uid of uids) {
    const b = before.get(uid) || {};
    const a = after.get(uid) || {};
    for (const role of ROLES) {
      const bs = b[role];
      const as = a[role];
      if (!isActive(bs) && !isActive(as)) continue;
      const beforeLegacy = hasLegacyFields(bs);
      const afterCanonical = isCanonical(as);
      const explicitlyQuarantined = !isActive(as) && as?.migrationDisposition === 'quarantined';
      const status = explicitlyQuarantined
        ? 'quarantined'
        : afterCanonical
          ? (beforeLegacy ? 'migrated-and-canonical' : 'canonical')
          : (isActive(as) ? 'active-noncanonical' : 'active-record-missing-after');
      rows.push({ uid, role, beforeLegacy, afterCanonical, status });
    }
  }

  const activeLegacyBefore = rows.filter(r => r.beforeLegacy);
  const migrated = rows.filter(r => r.status === 'migrated-and-canonical');
  const activeNoncanonicalAfter = rows.filter(r => r.status === 'active-noncanonical');
  const missingAfter = rows.filter(r => r.status === 'active-record-missing-after');
  const quarantined = rows.filter(r => r.status === 'quarantined');

  return {
    patch: 47,
    mode: 'read-only-proof',
    proof: {
      beforeActiveLegacyCount: activeLegacyBefore.length,
      migratedAndCanonicalCount: migrated.length,
      activeNoncanonicalAfterCount: activeNoncanonicalAfter.length,
      activeRecordMissingAfterCount: missingAfter.length,
      quarantinedCount: quarantined.length,
      parserRetirementEligible:
        activeLegacyBefore.length > 0 &&
        activeNoncanonicalAfter.length === 0 &&
        missingAfter.length === 0,
    },
    rows,
  };
}

if (process.argv[1] && process.argv[1].endsWith('boost-migration-proof.mjs')) {
  const beforeFile = process.argv[2];
  const afterFile = process.argv[3];
  if (!beforeFile || !afterFile) {
    console.error('Usage: node tools/boost-migration-proof.mjs <before.json> <after.json>');
    process.exit(2);
  }
  const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
  const after = JSON.parse(fs.readFileSync(afterFile, 'utf8'));
  console.log(JSON.stringify(proveMigration(before, after), null, 2));
}
