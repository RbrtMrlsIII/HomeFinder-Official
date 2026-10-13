import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRules, usersCreateRule, compareRules, fetchDeployedFirestoreRules } from './rules-drift.mjs';

const BROKEN = `match /users/{uid} {
  allow create: if isOwnerOf(uid)
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['firstName']);
  allow update: if isOwnerOf(uid) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['firstName']);
}
`;
const FIXED = `match /users/{uid} {
  // resource is null on create
  allow create: if isOwnerOf(uid) && request.resource.data.keys().hasOnly(['firstName']);
  allow update: if isOwnerOf(uid) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['firstName']);
}
`;

test('normalizeRules ignores line endings and trailing whitespace', () => {
  assert.equal(normalizeRules('a  \r\nb\r\n\r\n'), 'a\nb\n');
});

test('the users create rule is read from its own block, and an update rule that diffs resource.data is not mistaken for it', () => {
  assert.match(usersCreateRule(FIXED), /keys\(\)\.hasOnly/);
  assert.doesNotMatch(usersCreateRule(FIXED), /allow update/);
});

test('compareRules flags the old create rule that reads a null resource, and clears the fixed one', () => {
  const report = compareRules(BROKEN, FIXED);
  assert.equal(report.identical, false);
  assert.equal(report.usersCreateRule.deployed.readsNullResource, true);
  assert.equal(report.usersCreateRule.repo.readsNullResource, false);
  assert.equal(compareRules(FIXED, FIXED.replace(/\n/g, '\r\n')).identical, true);
});

const fakeApi = (releases, ruleset) => async (url) => {
  if (String(url).includes('/releases?')) return { ok: true, status: 200, json: async () => ({ releases }) };
  if (String(url).includes('/rulesets/')) return { ok: true, status: 200, json: async () => ruleset };
  return { ok: false, status: 404, json: async () => ({}) };
};

test('the named database release is selected and its rules text is returned', async () => {
  const fetchImpl = fakeApi(
    [{ name: 'projects/p/releases/cloud.firestore', rulesetName: 'projects/p/rulesets/default' },
     { name: 'projects/p/releases/cloud.firestore/homefinder', rulesetName: 'projects/p/rulesets/named', updateTime: '2026-09-01T00:00:00Z' }],
    { source: { files: [{ name: 'firestore.rules', content: 'RULES-TEXT' }] } });
  const got = await fetchDeployedFirestoreRules({ projectId: 'p', databaseId: 'homefinder', getToken: async () => 't', fetchImpl });
  assert.equal(got.found, true);
  assert.equal(got.release, 'projects/p/releases/cloud.firestore/homefinder');
  assert.equal(got.content, 'RULES-TEXT');
});

test('a missing release is reported, not guessed', async () => {
  const got = await fetchDeployedFirestoreRules({ projectId: 'p', databaseId: 'homefinder', getToken: async () => 't', fetchImpl: fakeApi([{ name: 'projects/p/releases/cloud.firestore', rulesetName: 'x' }], {}) });
  assert.equal(got.found, false);
});

test('an API failure throws a generic error that never contains the token', async () => {
  const fetchImpl = async () => ({ ok: false, status: 403, json: async () => ({}) });
  await assert.rejects(
    fetchDeployedFirestoreRules({ projectId: 'p', getToken: async () => 'SECRET-TOKEN', fetchImpl }),
    (error) => /403/.test(error.message) && !error.message.includes('SECRET-TOKEN'));
});
