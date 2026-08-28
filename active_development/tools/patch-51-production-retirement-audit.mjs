import fs from 'node:fs';
import crypto from 'node:crypto';

function fail(code, message) {
  const err = new Error(`${code}: ${message}`);
  err.code = code;
  throw err;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function stableJson(value) {
  return JSON.stringify(value, Object.keys(value ?? {}).sort());
}

function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : stableJson(value)).digest('hex');
}

function assertAuthorizedReceipt(receipt) {
  if (!receipt || receipt.authorized !== true) fail('PRODUCTION_AUTHORIZATION_MISSING', 'An authorized production receipt is required.');
  if (!receipt.snapshotId || !receipt.operator) fail('PRODUCTION_RECEIPT_INCOMPLETE', 'snapshotId and operator are required.');
  if (!receipt.approvedAt) fail('PRODUCTION_RECEIPT_INCOMPLETE', 'approvedAt is required.');
}

function normalizeRecord(doc) {
  const value = doc?.data ?? doc;
  return value && typeof value === 'object' ? value : {};
}

function activePackage(record, line) {
  const lineValue = record?.[line];
  if (!lineValue || typeof lineValue !== 'object') return null;
  if (lineValue.active !== true) return null;
  return lineValue.package;
}

function inspectSnapshot(snapshot) {
  const docs = Array.isArray(snapshot) ? snapshot : snapshot?.documents ?? (snapshot && typeof snapshot === 'object' ? Object.entries(snapshot).map(([id, data]) => ({ id, data })) : null);
  if (!Array.isArray(docs)) fail('SNAPSHOT_INVALID', 'Expected an array, {documents: []}, or a UID-keyed object.');

  let noncanonical = 0;
  let missing = 0;
  const offenders = [];
  const activeCount = [];

  for (const doc of docs) {
    const id = doc?.id ?? doc?.uid ?? '<unknown>';
    const record = normalizeRecord(doc);
    for (const line of ['seeker', 'owner']) {
      const pkg = activePackage(record, line);
      if (pkg === null) continue;
      activeCount.push(`${id}:${line}`);
      if (!Number.isInteger(pkg) || pkg < 0 || pkg > 5) {
        noncanonical += 1;
        offenders.push({ id, line, reason: 'noncanonical-package', package: pkg });
      }
      if (Object.prototype.hasOwnProperty.call(record[line], 'level')) {
        noncanonical += 1;
        offenders.push({ id, line, reason: 'retired-level-field' });
      }
    }
  }

  return { activeCount: activeCount.length, activeNoncanonicalAfterCount: noncanonical, activeRecordMissingAfterCount: missing, offenders };
}

export function auditProductionRetirement({ before, after, migrationReceipt, deploymentReceipt }) {
  assertAuthorizedReceipt(migrationReceipt);
  if (!deploymentReceipt || deploymentReceipt.deployed !== true) {
    fail('PRODUCTION_DEPLOYMENT_MISSING', 'A completed coordinated Patch 50 deployment receipt is required.');
  }
  if (!deploymentReceipt.releaseId || !deploymentReceipt.deployedAt) {
    fail('DEPLOYMENT_RECEIPT_INCOMPLETE', 'releaseId and deployedAt are required.');
  }
  if (deploymentReceipt.parserCompatibilityRestored === true) {
    fail('PARSER_RESTORATION_FORBIDDEN', 'Patch 50 retirement cannot be marked complete if compatibility was restored.');
  }

  const beforeHash = sha256(before);
  const afterHash = sha256(after);
  const expectedBeforeHash = migrationReceipt.beforeSnapshotSha256;
  if (expectedBeforeHash && expectedBeforeHash !== beforeHash) {
    fail('BEFORE_SNAPSHOT_HASH_MISMATCH', 'The supplied before snapshot does not match the authorized receipt.');
  }

  const beforeState = inspectSnapshot(before);
  const afterState = inspectSnapshot(after);

  const beforeDocs = Array.isArray(before) ? before : before?.documents ?? Object.entries(before ?? {}).map(([id, data]) => ({ id, data }));
  const afterDocs = Array.isArray(after) ? after : after?.documents ?? Object.entries(after ?? {}).map(([id, data]) => ({ id, data }));
  const beforeIds = new Set(beforeDocs.filter(d => { const r = normalizeRecord(d); return ['seeker','owner'].some(line => activePackage(r, line) !== null); }).map(d => `${d.id ?? d.uid}:`));
  for (const doc of afterDocs) {
    const id = doc?.id ?? doc?.uid;
    if (id == null) continue;
    beforeIds.delete(`${id}:`);
  }
  if (beforeIds.size) {
    fail('ACTIVE_RECORD_DISAPPEARANCE', `Records disappeared between snapshots: ${[...beforeIds].join(', ')}`);
  }

  if (afterState.activeNoncanonicalAfterCount !== 0) {
    fail('NONCANONICAL_ACTIVE_RECORDS', `${afterState.activeNoncanonicalAfterCount} active noncanonical boost line(s) remain.`);
  }

  const result = {
    patch: '51',
    status: 'production-retirement-verified',
    migrationSnapshotId: migrationReceipt.snapshotId,
    operator: migrationReceipt.operator,
    beforeSnapshotSha256: beforeHash,
    afterSnapshotSha256: afterHash,
    before: beforeState,
    after: afterState,
    deployment: {
      releaseId: deploymentReceipt.releaseId,
      deployedAt: deploymentReceipt.deployedAt
    },
    parserRetirement: 'verified',
    compatibilityRestoration: false,
    nextGate: 'Patch 52 — Post-Retirement SoT Closure & UI/UX Readiness Audit'
  };
  return result;
}

if (process.argv[1] && process.argv[1].endsWith('patch-51-production-retirement-audit.mjs')) {
  const [beforeFile, afterFile, migrationFile, deploymentFile, outputFile] = process.argv.slice(2);
  if (!beforeFile || !afterFile || !migrationFile || !deploymentFile || !outputFile) {
    console.error('Usage: node tools/patch-51-production-retirement-audit.mjs BEFORE AFTER MIGRATION_RECEIPT DEPLOYMENT_RECEIPT OUTPUT');
    process.exit(2);
  }
  try {
    const result = auditProductionRetirement({
      before: readJson(beforeFile),
      after: readJson(afterFile),
      migrationReceipt: readJson(migrationFile),
      deploymentReceipt: readJson(deploymentFile)
    });
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2) + '\n');
    console.log(`Patch 51 production retirement audit PASS: ${outputFile}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
