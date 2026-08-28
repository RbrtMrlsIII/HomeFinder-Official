import fs from "node:fs";
import assert from "node:assert/strict";

const rules = fs.readFileSync("active_development/firebase/firestore.rules", "utf8");
const contract = JSON.parse(fs.readFileSync("docs/json/contracts/support-ticket-authority.json", "utf8"));
const userTicket = fs.readFileSync("active_development/js/profile/support-ticket.js", "utf8");
const opsTicket = fs.readFileSync("active_development/js/admin/support-tickets.js", "utf8");

assert.equal(contract.initialPool, "staff");
assert.equal(contract.claim.atomic, true);
assert.equal(contract.transfer.staffTo, "moderator");
assert.equal(contract.transfer.moderatorTo, "admin");
assert.match(rules, /match \/supportTickets\/\{ticketId\}/);
assert.match(rules, /request\.resource\.data\.assignedTo == request\.auth\.uid/);
assert.match(opsTicket, /runTransaction\(db/);
assert.match(userTicket, /st-user-reply/);
assert.match(userTicket, /arrayUnion/);
assert.match(opsTicket, /assignedRole: target/);
assert.match(opsTicket, /if \(pool !== me\) throw new Error/);
assert.doesNotMatch(opsTicket, /opsJoinConsent/);
assert.match(rules, /isAuthorizedContractNotification\(uid\)/);
assert.doesNotMatch(rules, /isConversationCoParticipantNotifying/);
assert.match(rules, /resource\.data\.assignedRole == 'staff'/);
assert.match(rules, /resource\.data\.assignedRole == 'moderator'/);
assert.match(rules, /resource\.data\.assignedRole == 'admin'/);

console.log("support-ticket-authority: PASS");
