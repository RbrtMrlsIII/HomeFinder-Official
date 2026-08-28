import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runMultiCheckAudit } from '../tools/patch-52-multi-check-audit.mjs';

const root = process.cwd();
const result = runMultiCheckAudit(root);

assert.equal(result.patch, '52');
assert.equal(result.failureCount, 0, result.failures.join('\n'));
assert.ok(result.checks.length > 20);
assert.equal(fs.existsSync(path.join(root, 'docs/architecture/PATCH-52-MULTI-CHECK-WIRING-MAP.json')), true);

console.log(`Patch 52 multi-check wiring audit PASS (${result.checks.length} checks, ${result.warningCount} warnings).`);
