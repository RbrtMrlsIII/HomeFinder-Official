/* ==================================== */
/*  CORE                                */
/* ==================================== */
/* Auth guard shared by every profile module. Every other file  */
/* in this folder imports { user, auth, db } from here.         */
/* Broker profile is an embedded workspace owned by Broker HQ; */
/* direct top-level profile access is not a broker destination. */

import { auth, db, functions } from "../firebase.js";
import { requireAuth } from "../session.js";
import { canonicalRoleFromData } from "../canonical-role.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export { auth, db, functions };
export const user = await requireAuth("login.html");

if (user) {
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = canonicalRoleFromData(snap.exists() ? snap.data() : {}, null);

        const params = new URLSearchParams(location.search);
        const embeddedBrokerHQ =
            params.get("embedded") === "broker-hq" &&
            window.top !== window.self &&
            document.referrer.includes("broker-hq.html");

        const brokerHQOwnerPage =
            /(?:^|\/)broker-hq\.html$/.test(location.pathname);

        if (role === "broker" && !embeddedBrokerHQ && !brokerHQOwnerPage) {
            window.location.replace("broker-hq.html");
        }

        // Broker HQ imports selected profile modules (e.g. contracts) directly.
        // Those imports inherit this page-level guard without opening profile.html.
    } catch (error) {
        console.warn("Profile role guard read failed:", error);
    }
}
