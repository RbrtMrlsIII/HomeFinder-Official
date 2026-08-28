import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(new URL('.', import.meta.url).pathname, '..');
const rules = fs.readFileSync(path.join(root, 'firebase/firestore.rules'), 'utf8');
const projection = fs.readFileSync(path.join(root, 'firebase/functions/publicProfileProjection.js'), 'utf8');
const visitor = fs.readFileSync(path.join(root, 'js/profile/visitor-profile.js'), 'utf8');
const search = fs.readFileSync(path.join(root, 'js/profile/user-search.js'), 'utf8');
const messages = fs.readFileSync(path.join(root, 'js/profile/messages.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');

assert.match(rules, /match \/publicProfiles\/\{uid\}/);
assert.match(rules, /allow read: if true;/);
assert.match(rules, /allow write: if false;/);
assert.doesNotMatch(visitor, /getDoc\(doc\(db,\s*["']users["'],\s*visitUid\)/);
assert.doesNotMatch(search, /collection\(db,\s*["']users["']/);
assert.match(visitor, /publicProfiles/);
assert.match(search, /publicProfiles/);
assert.match(messages, /getConversationPeerProfile/);
assert.match(index, /exports\.getConversationPeerProfile/);
assert.match(index, /participantIds\.includes\(uid\)/);
assert.match(index, /participantIds\.includes\(peerUid\)/);

for (const field of ['email','phone','idVerification','brokerLicense','mapState','pins','payment','subscription']) {
  assert.doesNotMatch(projection, new RegExp(`^\\s*${field}\\s*:`, 'm'), `Projection root must not expose raw ${field}`);
}
assert.match(projection, /publicEmail:/);
assert.match(projection, /publicPhone:/);
assert.match(projection, /publicCity:/);
console.log('public-profile-migration: PASS');
