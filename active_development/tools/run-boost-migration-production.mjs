#!/usr/bin/env node
/**
 * Patch 48 operator entrypoint.
 *
 * Default mode is PLAN. Production mutation requires all explicit guards:
 *   --execute
 *   --snapshot <path>
 *   --snapshot-id <id>
 *   --operator <name>
 *   HOMEFINDER_BOOST_MIGRATION_AUTHORIZED=1
 *
 * This script is intentionally NOT run by the patch build/test process.
 */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { executeMigration } from './boost-migration-executor.mjs';
import { createFirebaseAdminAdapter } from './adapters/firebase-admin-production-adapter.mjs';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const execute = process.argv.includes('--execute');
const snapshotFile = arg('--snapshot');
const snapshotId = arg('--snapshot-id');
const operator = arg('--operator');

if (!snapshotFile) {
  console.error('Usage: node tools/run-boost-migration-production.mjs --snapshot <before.json> [--execute --snapshot-id <id> --operator <name>]');
  process.exit(2);
}

const before = JSON.parse(await fs.readFile(snapshotFile, 'utf8'));
const beforeSha256 = crypto.createHash('sha256').update(JSON.stringify(before)).digest('hex');

if (!execute) {
  const { buildMigrationPlan } = await import('./boost-migration-executor.mjs');
  console.log(JSON.stringify({ mode: 'plan-only', beforeSha256, plan: buildMigrationPlan(before) }, null, 2));
  process.exit(0);
}

if (process.env.HOMEFINDER_BOOST_MIGRATION_AUTHORIZED !== '1') {
  throw new Error('Production execution blocked: HOMEFINDER_BOOST_MIGRATION_AUTHORIZED=1 is required.');
}

const adapter = createFirebaseAdminAdapter();
const result = await executeMigration({
  beforeInput: before,
  adapter,
  receipt: { authorized: true, snapshotId, operator }
});

const afterSha256 = crypto.createHash('sha256').update(JSON.stringify(result.after)).digest('hex');
const receipt = {
  patch: 48,
  migration: 'boost',
  authorized: true,
  snapshotId,
  operator,
  beforeSha256,
  afterSha256,
  plannedChanges: result.plan.changes.length,
  quarantined: result.plan.quarantines.length,
  proof: result.proof.proof,
  status: 'completed'
};
console.log(JSON.stringify(receipt, null, 2));
