#!/usr/bin/env node
/**
 * Patch 48: Production Boost Migration Execution Gate.
 *
 * This module is intentionally authority-agnostic. It does not contain
 * Firebase credentials and does not silently choose a write path.
 * A production adapter must expose:
 *   - readSnapshot() -> JSON export shaped like {uid: data}
 *   - writeCanonical(changes, receipt) -> writes only approved deterministic changes
 *   - readSnapshot() -> fresh post-write snapshot
 *
 * The executor validates the preserved before snapshot, quarantines conflicts
 * in the plan, writes only deterministic canonical changes, then verifies the
 * fresh readback with Patch 47 proof.
 */
import fs from 'node:fs';
import { auditExport } from './boost-normalization.mjs';
import { proveMigration } from './boost-migration-proof.mjs';

const ROLES = ['seeker', 'owner'];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function records(input) {
  if (Array.isArray(input)) return input.map(r => ({ uid: String(r.uid || ''), data: clone(r.data || {}) }));
  return Object.entries(input || {}).map(([uid, data]) => ({ uid, data: clone(data || {}) }));
}

function canonicalFromAudit(roleAudit) {
  return roleAudit?.recommendWrite?.package;
}

export function buildMigrationPlan(beforeInput) {
  const audited = auditExport(beforeInput);
  const changes = [];
  const quarantines = [];
  const blockers = [];

  for (const record of audited) {
    for (const role of ROLES) {
      const r = record.roles[role];
      if (!r.active) continue;
      if (r.status === 'conflict' || r.status === 'missing-package') {
        quarantines.push({ uid: record.uid, role, reason: r.status });
        continue;
      }
      const packageId = canonicalFromAudit(r);
      if (r.status !== 'canonical' && packageId == null) {
        blockers.push({ uid: record.uid, role, reason: r.status });
        continue;
      }
      if (r.status !== 'canonical') {
        changes.push({ uid: record.uid, role, package: packageId });
      }
    }
  }

  return {
    patch: 48,
    mode: 'production-execution-gate',
    changes,
    quarantines,
    blockers,
    executable: quarantines.length === 0 && blockers.length === 0,
  };
}

function applyPlanLocally(beforeInput, plan) {
  const after = clone(beforeInput);
  for (const change of plan.changes) {
    if (!after[change.uid]) after[change.uid] = {};
    after[change.uid][change.role] = {
      ...(after[change.uid][change.role] || {}),
      active: true,
      package: change.package,
    };
    delete after[change.uid][change.role].level;
  }
  for (const q of plan.quarantines) {
    if (!after[q.uid]) after[q.uid] = {};
    after[q.uid][q.role] = {
      ...(after[q.uid][q.role] || {}),
      active: false,
      migrationDisposition: 'quarantined',
      migrationReason: q.reason,
    };
  }
  return after;
}

export async function executeMigration({ beforeInput, adapter, receipt }) {
  if (!adapter || typeof adapter.readSnapshot !== 'function' || typeof adapter.writeCanonical !== 'function') {
    throw new Error('Production adapter must provide readSnapshot() and writeCanonical().');
  }
  if (!receipt || receipt.authorized !== true || !receipt.snapshotId || !receipt.operator) {
    throw new Error('Execution requires an authorized receipt with snapshotId and operator.');
  }

  const preservedBefore = clone(beforeInput);
  const liveBefore = await adapter.readSnapshot();
  if (JSON.stringify(liveBefore) !== JSON.stringify(preservedBefore)) {
    throw new Error('LIVE_SNAPSHOT_MISMATCH: preserved before snapshot does not match fresh pre-write read.');
  }

  const plan = buildMigrationPlan(preservedBefore);
  if (!plan.executable) {
    const error = new Error('MIGRATION_BLOCKED: conflicts or unresolved active records remain.');
    error.plan = plan;
    throw error;
  }

  await adapter.writeCanonical(plan.changes, receipt);
  const after = await adapter.readSnapshot();
  const proof = proveMigration(preservedBefore, after);

  if (proof.proof.activeNoncanonicalAfterCount > 0 || proof.proof.activeRecordMissingAfterCount > 0) {
    const error = new Error('READBACK_FAILED: migration proof did not establish a clean active canonical state.');
    error.proof = proof;
    throw error;
  }

  return { plan, proof, before: preservedBefore, after };
}

if (process.argv[1] && process.argv[1].endsWith('boost-migration-executor.mjs')) {
  const beforeFile = process.argv[2];
  const mode = process.argv[3] || 'plan';
  if (!beforeFile) {
    console.error('Usage: node tools/boost-migration-executor.mjs <before.json> [plan|preview]');
    process.exit(2);
  }
  const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
  const plan = buildMigrationPlan(before);
  if (mode === 'preview') {
    console.log(JSON.stringify({ plan, proposedAfter: applyPlanLocally(before, plan) }, null, 2));
  } else {
    console.log(JSON.stringify(plan, null, 2));
  }
}
