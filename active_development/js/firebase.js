/* ================================ */
/*  FIREBASE                        */
/* ================================ */
/* Initializes Firebase, exports db + auth. */
/* Everything else imports from here. */

import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initializeFirestore } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFunctions }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgRjepKLzn8_a7lVstLrpdDCC2znW7XoE",
  authDomain: "homefinder-official.firebaseapp.com",
  projectId: "homefinder-official",
  storageBucket: "homefinder-official.firebasestorage.app",
  messagingSenderId: "786765757705",
  appId: "1:786765757705:web:7c3bd856fbef3358d027d8",
  measurementId: "G-SCS9XFYFLM"
};

const app = initializeApp(firebaseConfig);
// experimentalForceLongPolling (not just auto-detect): this project gets
// tested across several unusual embedded-browser environments -- Acode's
// WebView, Cloud Shell's web preview proxy -- where Firestore's default
// streaming connection (WebChannel/gRPC) is known to hang indefinitely
// (never resolves, never rejects). Auto-detect alone wasn't reliable
// enough here: its own detection step can race against and lose to this
// app's 15s client-side timeout guards, producing the exact same silent
// hang it was meant to prevent. Forcing long-polling unconditionally
// removes that race -- small constant overhead, much higher reliability.
/* IMPORTANT: third argument is a *named* Firestore database id.
 * HomeFinder uses the named database "homefinder". The client and trusted
 * backend must use this same database id. */
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
}, "homefinder"); // data lives in named DB "homefinder" (see Firebase console)
export { db, app };
export const auth = getAuth(app);
/* Used by listing-form.js to call the createListing callable (see  */
/* functions/index.js) instead of writing to canonical `propertyListings` directly. */
export const functions = getFunctions(app);
