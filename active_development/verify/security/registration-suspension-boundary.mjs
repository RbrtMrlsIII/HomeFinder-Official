import fs from 'node:fs';
import assert from 'node:assert/strict';

const rules = fs.readFileSync(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8');
const auth = fs.readFileSync(new URL('../../js/auth.js', import.meta.url), 'utf8');
const cooldown = fs.readFileSync(new URL('../../js/profile/profile-cooldown.js', import.meta.url), 'utf8');
const profile = fs.readFileSync(new URL('../../js/profile/profile-data.js', import.meta.url), 'utf8');
const functions = fs.readFileSync(new URL('../../firebase/functions/index.js', import.meta.url), 'utf8');
const admin = fs.readFileSync(new URL('../../js/admin/users.js', import.meta.url), 'utf8');

assert.match(rules, /\^63\[0-9\]\{10\}\$/);
assert.match(auth, /if \(\/\^09\\d\{9\}\$\//);
assert.match(auth, /if \(\/\^63\\d\{10\}\$\//);
assert.match(cooldown, /exactly 12 digits/);
assert.match(profile, /exactly 12 digits/);
assert.match(functions, /async function requireActiveUser/);
assert.match(functions, /exports\.syncUserSuspension/);
assert.match(functions, /exports\.setUserSuspension/);
assert.match(functions, /exports\.claimVerifiedPhone/);
assert.match(admin, /httpsCallable\(functions, "setUserSuspension"\)/);
assert.doesNotMatch(fs.readFileSync(new URL('../../js/profile/profile-cooldown.js', import.meta.url), 'utf8'), /setDoc\(doc\(db, "phoneIndex"/);

console.log('registration-suspension-boundary: PASS');
