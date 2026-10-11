import { appendFileSync } from 'node:fs';
import { probe } from './lib.mjs';

const [baseUrl, attempts = '10', delayMs = '6000'] = process.argv.slice(2);
if (!baseUrl) {
  console.error('usage: node scripts/pages/probe.mjs <baseUrl> [attempts] [delayMs]');
  process.exit(2);
}
const result = await probe(baseUrl, { attempts: Number(attempts), delayMs: Number(delayMs) });
const lines = result.results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `### Live probe: ${baseUrl}\n\n| Check | Result |\n|---|---|\n${result.results.map((r) => `| ${r.name} | ${r.ok ? 'pass' : 'FAIL'} ${r.detail} |`).join('\n')}\n`);
}
console.log(result.ok ? 'Live site: PASS' : 'Live site: FAIL');
process.exit(result.ok ? 0 : 1);
