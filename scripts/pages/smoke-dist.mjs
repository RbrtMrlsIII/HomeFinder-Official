import { verifyDist, probe, startPagesLikeServer } from './lib.mjs';

const dist = process.argv[2] || 'dist';
const verified = verifyDist(dist);
for (const note of verified.notes) console.log(`note: ${note}`);
for (const problem of verified.problems) console.error(`FAIL: ${problem}`);
if (!verified.ok) process.exit(1);

const { server, url } = await startPagesLikeServer(dist);
try {
  const result = await probe(url, { attempts: 1, delayMs: 0 });
  for (const r of result.results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
  console.log(result.ok ? `Pages artifact served under ${new URL(url).pathname}: PASS` : 'Pages artifact smoke test: FAIL');
  process.exitCode = result.ok ? 0 : 1;
} finally {
  server.close();
}
