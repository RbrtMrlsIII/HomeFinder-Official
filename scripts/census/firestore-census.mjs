#!/usr/bin/env node
// Owner-run, READ-ONLY census of the HomeFinder Firestore: counts and dates only.
//   node firestore-census.mjs --project homefinder-official [--database homefinder] [--out census.json]
//   node firestore-census.mjs --project demo-census --emulator 127.0.0.1:8080      (local emulator)
// Run it on your own machine with your own credentials (gcloud auth application-default login, or a
// read-only role such as roles/datastore.viewer). Nothing is written to Firestore and no key is read here.
import { writeFileSync } from 'node:fs';
import { runCensus } from './lib.mjs';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a.startsWith('--')) args.set(a.slice(2), process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[++i]);
}
const project = args.get('project');
const database = typeof args.get('database') === 'string' ? args.get('database') : 'homefinder';
const emulator = typeof args.get('emulator') === 'string' ? args.get('emulator') : null;
if (typeof project !== 'string') {
  console.error('usage: node firestore-census.mjs --project <id> [--database homefinder] [--out file.json] [--emulator host:port]');
  process.exit(2);
}
if (emulator) {
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(emulator)) { console.error('--emulator must be a local host:port'); process.exit(2); }
  process.env.FIRESTORE_EMULATOR_HOST = emulator;
}

let initializeApp; let applicationDefault; let getFirestore;
try {
  ({ initializeApp, applicationDefault } = await import('firebase-admin/app'));
  ({ getFirestore } = await import('firebase-admin/firestore'));
} catch {
  console.error('firebase-admin is not installed. Run `npm install` in scripts/census first.');
  process.exit(2);
}
const app = initializeApp(emulator ? { projectId: project } : { credential: applicationDefault(), projectId: project });
const db = getFirestore(app, database);

console.log(`READ-ONLY census of ${project} / ${database}${emulator ? ' (emulator)' : ''}: counts and dates only.`);
const result = await runCensus(db, { project, database });
const out = typeof args.get('out') === 'string' ? args.get('out') : `census-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
console.log(`\nWritten to ${out}. Share that file (it contains no personal data).${result.notes.length ? ` ${result.notes.length} note(s) above explain missing numbers.` : ''}`);
