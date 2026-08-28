import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'docs/dictionary/INDEX.json',
  'docs/dictionary/domains/data.dictionary.json',
  'docs/dictionary/domains/roles.dictionary.json',
  'docs/dictionary/domains/capabilities.dictionary.json',
  'docs/dictionary/domains/routes.dictionary.json',
  'docs/dictionary/domains/integrations.dictionary.json',
  'docs/dictionary/domains/ui-ownership.dictionary.json',
  'docs/dictionary/domains/lifecycle.dictionary.json'
];

for (const rel of files) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) throw new Error(`Missing dictionary file: ${rel}`);
  JSON.parse(fs.readFileSync(full, 'utf8'));
}

const index = JSON.parse(fs.readFileSync(path.join(root, 'docs/dictionary/INDEX.json'), 'utf8'));
for (const rel of index.domains) {
  if (!fs.existsSync(path.join(root, 'docs/dictionary', rel))) {
    throw new Error(`Dictionary index points to missing domain: ${rel}`);
  }
}

const rule = fs.readFileSync(path.join(root, 'docs/dictionary/CONTRACT-CHANGE-RULE.md'), 'utf8');
for (const phrase of [
  'AUTHORITATIVE DEFINITION',
  'DICTIONARY / SCHEMA',
  'PRODUCERS / WRITERS',
  'CONSUMERS / READERS',
  'TEST ORACLE + READBACK',
  'PATCH DOCS + CHANGELOG'
]) {
  if (!rule.includes(phrase)) throw new Error(`Contract-change rule missing required stage: ${phrase}`);
}

const roadmap = fs.readFileSync(path.join(root, 'docs/dictionary/PHASE-ROADMAP.md'), 'utf8');
for (const phase of ['Phase D0', 'Phase D1', 'Phase D2', 'Phase D3', 'Phase D4', 'Phase D5', 'Phase D6', 'Phase D7']) {
  if (!roadmap.includes(phase)) throw new Error(`Missing roadmap phase: ${phase}`);
}

console.log('Patch 35 dictionary foundation checks passed.');
