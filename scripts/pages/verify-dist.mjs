import { verifyDist } from './lib.mjs';

const dist = process.argv[2] || 'dist';
const result = verifyDist(dist);
for (const note of result.notes) console.log(`note: ${note}`);
for (const problem of result.problems) console.error(`FAIL: ${problem}`);
console.log(result.ok ? `Pages artifact: PASS (${dist})` : `Pages artifact: FAIL (${result.problems.length} problem(s))`);
process.exit(result.ok ? 0 : 1);
