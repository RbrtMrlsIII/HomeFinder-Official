#!/usr/bin/env node
// Owner-run, READ-ONLY check: are the DEPLOYED Firestore rules the same as the repository's?
//   node rules-drift.mjs --project homefinder-official [--database homefinder] [--rules ../../active_development/firebase/firestore.rules] [--save deployed.rules]
// Needs a credential with roles/firebaserules.viewer (your own gcloud login is enough). Nothing is changed.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function normalizeRules(text) {
  return `${String(text).replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/[ \t]+$/g, '')).join('\n').trim()}\n`;
}
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

/** The users/{uid} create rule, as written in a rules file (first `allow create` in that block). */
export function usersCreateRule(text) {
  const start = text.indexOf('match /users/{uid}');
  if (start < 0) return null;
  const m = text.slice(start).match(/allow create:[\s\S]*?;/);
  return m ? m[0] : null;
}
const readsNullResource = (rule) => !!rule && /(?<!request\.)resource\.data/.test(rule);

export async function fetchDeployedFirestoreRules({ projectId, databaseId = 'homefinder', getToken, fetchImpl = fetch }) {
  const headers = { Authorization: `Bearer ${await getToken()}` };
  const getJson = async (url) => {
    const res = await fetchImpl(url, { headers });
    if (!res.ok) throw new Error(`Rules API request failed (${res.status}).`);
    return res.json();
  };
  const list = await getJson(`https://firebaserules.googleapis.com/v1/projects/${projectId}/releases?pageSize=100`);
  const releases = (list.releases || []).filter((r) => /\/releases\/cloud\.firestore(\/|$)/.test(r.name));
  const wanted = releases.find((r) => r.name.endsWith(`/cloud.firestore/${databaseId}`))
    || (databaseId === '(default)' ? releases.find((r) => r.name.endsWith('/cloud.firestore')) : null);
  if (!wanted) return { found: false, releases: releases.map((r) => r.name) };
  const ruleset = await getJson(`https://firebaserules.googleapis.com/v1/${wanted.rulesetName}`);
  const file = (ruleset.source?.files || [])[0];
  return { found: true, release: wanted.name, rulesetName: wanted.rulesetName, updateTime: wanted.updateTime || null, content: file?.content || '' };
}

export function compareRules(deployedText, repoText) {
  const deployed = normalizeRules(deployedText);
  const repo = normalizeRules(repoText);
  const deployedCreate = usersCreateRule(deployed);
  const repoCreate = usersCreateRule(repo);
  return {
    identical: deployed === repo,
    deployedSha256: sha256(deployed),
    repoSha256: sha256(repo),
    deployedLines: deployed.split('\n').length - 1,
    repoLines: repo.split('\n').length - 1,
    usersCreateRule: {
      deployed: { present: deployedCreate !== null, readsNullResource: readsNullResource(deployedCreate) },
      repo: { present: repoCreate !== null, readsNullResource: readsNullResource(repoCreate) }
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };
  const projectId = arg('project');
  if (!projectId) { console.error('usage: node rules-drift.mjs --project <id> [--database homefinder] [--rules path] [--save file]'); process.exit(2); }
  let GoogleAuth;
  try { ({ GoogleAuth } = await import('google-auth-library')); } catch { console.error('Run `npm install` in scripts/census first.'); process.exit(2); }
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const deployed = await fetchDeployedFirestoreRules({
    projectId, databaseId: arg('database', 'homefinder'),
    getToken: async () => (await (await auth.getClient()).getAccessToken()).token
  });
  if (!deployed.found) { console.log(JSON.stringify({ found: false, releasesSeen: deployed.releases }, null, 2)); process.exit(1); }
  if (arg('save')) writeFileSync(arg('save'), deployed.content);
  const repoRules = readFileSync(arg('rules', new URL('../../active_development/firebase/firestore.rules', import.meta.url)), 'utf8');
  const report = { release: deployed.release, deployedAt: deployed.updateTime, ...compareRules(deployed.content, repoRules) };
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.identical ? 0 : 1);
}
