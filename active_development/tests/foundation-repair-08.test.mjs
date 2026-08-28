import fs from 'node:fs';
import assert from 'node:assert/strict';

const rules = fs.readFileSync('firebase/firestore.rules', 'utf8');
const authority = fs.readFileSync('js/authority-contract.js', 'utf8');
const moderatorHtml = fs.readFileSync('moderator.html', 'utf8');

assert.match(authority, /"admin\.manageUser": Object\.freeze\(\["admin"\]\)/);
assert.match(rules, /allow update: if isAdmin\(\)\s*\n\s*\|\| \(/);
assert.doesNotMatch(rules, /allow update: if isAdmin\(\)\s*\n\s*\|\| \(isModerator\(\)/);
assert.doesNotMatch(moderatorHtml, /verifications\.js/);

console.log('Foundation Repair 08 authority test: PASS');
