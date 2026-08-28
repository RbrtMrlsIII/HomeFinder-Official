/* ================================ */
/*  SESSION                         */
/* ================================ */
/* requireAuth() / isLoggedIn() -- waits for real */
/* Firebase auth state before acting on it. */

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let resolveReady;
export const authReady = new Promise((resolve)=>{ resolveReady = resolve; });

export let currentUser = null;

onAuthStateChanged(auth, (user)=>{
    currentUser = user;
    resolveReady(user);
});

// use this on PROTECTED pages (e.g. profile.html) that should bounce
// guests AND unverified accounts to login. auth.js's login form
// already blocks unverified sign-ins going forward -- this closes the
// other half: an unverified session that existed BEFORE that check
// was added (or reached here some other way) than the login form.
export async function requireAuth(redirectTo = "login.html"){
    const user = await authReady;
    if(!user || !user.emailVerified){
        window.location.href = redirectTo;
        return null;
    }
    return user;
}

// use this to check state without redirecting anywhere
// (e.g. the search icon gate on index.html)
export async function isLoggedIn(){
    const user = await authReady;
    return user !== null;
}