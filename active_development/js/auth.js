/* ================================ */
/*  AUTH                            */
/* ================================ */
/* Login + register forms, Google/Facebook popups, toasts. */

import { auth, db, functions } from "./firebase.js";
import { normalizeCanonicalRole } from "./canonical-role.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendEmailVerification,
    updateProfile,
    GoogleAuthProvider,
    FacebookAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { isAdminUid, isModeratorUid, isStaffRoleUid, opsRoleForUid } from "./admin-uid.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { routeAccess } from "./route-access-contract.js";



/** Ops roles land on their console after login (not profile/home). */
function opsHomeForUid(uid) {
    if (!uid) return null;
    if (isAdminUid(uid)) return "admin.html";
    if (isModeratorUid(uid)) return "moderator.html";
    if (isStaffRoleUid(uid)) return "staff.html";
    return null;
}

async function postAuthRedirect(fallback = "profile.html") {
    const uid = auth.currentUser?.uid;
    if (!uid) { window.location.href = fallback; return; }
    let role = "seeker";
    try {
        const snap = await getDoc(doc(db, "users", uid));
        const raw = snap.exists() ? (snap.data()?.canonicalRole || snap.data()?.accountType || snap.data()?.role) : null;
        const normalized = normalizeCanonicalRole(raw);
        if (["admin", "moderator", "staff"].includes(normalized)) {
            window.location.href = ({admin:"admin.html", moderator:"moderator.html", staff:"staff.html"})[normalized];
            return;
        }
        if (["owner", "seeker", "broker"].includes(normalized)) role = normalized;
    } catch (_) {
        const ops = opsRoleForUid(uid);
        if (ops) { window.location.href = ({admin:"admin.html", moderator:"moderator.html", staff:"staff.html"})[ops]; return; }
    }
    let next=null; try { const params=new URLSearchParams(window.location.search); next=params.get("next")||params.get("redirect"); } catch (_) {}
    if(next && /^[a-zA-Z0-9_./-]+\.html(\?.*)?$/.test(next) && !next.includes("://")){
      const decision=routeAccess(next,role);
      if(decision.allowed){ const page=String(next).split("?")[0].split("/").pop(); window.location.href=(page==="market.html"&&role==="broker")?"broker-hq.html":next; return; }
    }
    window.location.href=fallback;
}

function normalizePhone(phone) {
    const raw = String(phone || "").replace(/\D/g, "");
    // HomeFinder targets Philippine mobile identities only. Canonical storage
    // is exactly 12 digits in international form: 639XXXXXXXXX.
    if (/^09\d{9}$/.test(raw)) return `63${raw.slice(1)}`;
    if (/^63\d{10}$/.test(raw)) return raw;
    return "";
}

async function phoneAlreadyTaken(phone, exceptUid = null) {
    const digits = normalizePhone(phone);
    if (digits.length !== 12) return false;
    try {
        const checkPhoneAvailability = httpsCallable(functions, "checkPhoneAvailability");
        const result = await checkPhoneAvailability({ phone: digits });
        return result?.data?.available === false;
    } catch (_) {
        return false;
    }
}

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

/*=====================================*/
/* EMAIL VERIFICATION LINK TARGET      */
/*=====================================*/
/* handleCodeInApp MUST be true for `url` to actually replace         */
/* Firebase's hosted action page. With it false (as this was), the    */
/* email link still opened Firebase's own generic                     */
/* "<project>.firebaseapp.com/__/auth/action" page first -- THAT page */
/* applies the verification code itself and shows its own "Your email */
/* has been verified / Continue" screen, then its Continue button     */
/* just navigates to `url` with NO oobCode/mode left in the query     */
/* string (the code was already consumed). Landing on our verify/     */
/* index.html with no params made it fall into the "Invalid link"     */
/* branch right after a SUCCESSFUL verification -- that dead end is   */
/* the "stuck after tapping Continue" bug.                            */
/* With handleCodeInApp:true, the email link goes straight to `url`   */
/* WITH mode & oobCode intact, skipping Firebase's hosted page         */
/* entirely -- verify/index.html's own applyActionCode() call (below) */
/* is what actually confirms the email, and its own button is what    */
/* the person continues from. Built with window.location.origin so it */
/* keeps working whether this is served from *.web.app,               */
/* *.firebaseapp.com, or a custom domain later -- just make sure every */
/* domain this is loaded from is listed under Authentication >        */
/* Settings > Authorized domains in the Firebase console.              */
const verifyEmailActionCodeSettings = {
    // After Firebase's hosted handler (or our custom page) finishes,
    // user lands here as a welcome screen before login.
    url: `${window.location.origin}/verify/index.html?welcome=1`,
    handleCodeInApp: true
};

/*=====================================*/
/* TOAST NOTIFICATIONS                 */
/*=====================================*/

const toastContainer = document.getElementById("toast-container");

function showToast(type, title, message){
    if(!toastContainer) return;

    const icons = {
        success:"bx-check-circle",
        error:"bx-error-circle",
        info:"bx-info-circle"
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class='bx ${icons[type]}'></i>
        <div>
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(()=>{
        toast.classList.add("leaving");
        setTimeout(()=> toast.remove(), 300);
    }, 4500);
}

/*=====================================*/
/* TYPING STATUS LINE                  */
/*=====================================*/

let statusTimeout = null;

function typeStatus(elementId, text){
    const el = document.getElementById(elementId);
    if(!el) return;

    clearTimeout(statusTimeout);
    el.innerHTML = "";
    let i = 0;

    function step(){
        el.innerHTML = text.substring(0,i) + '<span class="cursor"></span>';
        i++;
        if(i <= text.length){
            statusTimeout = setTimeout(step, 28);
        }
    }
    step();
}

function clearStatus(elementId){
    const el = document.getElementById(elementId);
    if(el){
        clearTimeout(statusTimeout);
        el.innerHTML = "";
    }
}

/*=====================================*/
/* BUTTON LOADING STATE                */
/*=====================================*/

function setLoading(button, loading){
    if(!button) return;
    button.disabled = loading;
    button.classList.toggle("loading", loading);
}

/*=====================================*/
/* TIMEOUT GUARD                       */
/*=====================================*/
/* Nothing in this file used to have a timeout -- if any single       */
/* Firebase call hung on a slow/dropped connection (account creation, */
/* sending the verification email, or saving the profile), the whole  */
/* registration flow just sat frozen forever with no way out, since   */
/* every step after it is a sequential await. This wraps a promise    */
/* with a hard ceiling so a hang surfaces as an error instead.        */

function withTimeout(promise, ms, label){
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} took too long -- check your connection and try again.`)), ms)
        )
    ]);
}

/*=====================================*/
/* FIREBASE ERROR -> READABLE MESSAGE  */
/*=====================================*/

function friendlyError(error){
    if (error && error.code === "homefinder/suspended") {
        return "This account has been suspended. Contact support.";
    }
    const code = error.code || "";
    const map = {
        "auth/email-already-in-use":"An account with this email already exists.",
        "auth/weak-password":"Password should be at least 6 characters.",
        "auth/invalid-email":"That email address doesn't look right.",
        "auth/wrong-password":"Incorrect email or password.",
        "auth/user-not-found":"Incorrect email or password.",
        "auth/invalid-credential":"Incorrect email or password.",
        "auth/user-disabled":"This account has been disabled. Contact support for help.",
        "auth/too-many-requests":"Too many failed attempts. Please wait a moment and try again.",
        "auth/popup-closed-by-user":"Sign-in popup was closed before finishing.",
        "auth/account-exists-with-different-credential":"An account already exists using a different sign-in method."
    };
    return map[code] || "Something went wrong. Please try again.";
}

/*=====================================*/
/* PASSWORD SHOW / HIDE                */
/*=====================================*/

document.querySelectorAll(".pass-toggle").forEach((btn) => {
    if (!btn.hasAttribute("aria-label")) btn.setAttribute("aria-label", "Show password");
    btn.setAttribute("aria-pressed", "false");
    btn.type = "button";
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetId = btn.getAttribute("data-target");
        const input = targetId ? document.getElementById(targetId) : btn.closest(".input-wrap")?.querySelector("input");
        if (!input) return;
        const icon = btn.querySelector("i");
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        if (icon) {
            icon.classList.toggle("bx-hide", showing);
            icon.classList.toggle("bx-show", !showing);
        }
        btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
        btn.setAttribute("aria-pressed", String(!showing));
    });
});

/*=====================================*/
/* REGISTER: live password match check */
/*=====================================*/

const regPassword = document.getElementById("reg-password");
const confirmPassword = document.getElementById("confirm-password");
const matchHint = document.getElementById("password-match-hint");

function checkPasswordMatch(){
    if(!regPassword || !confirmPassword || !matchHint) return true;
    if(confirmPassword.value === ""){
        matchHint.textContent = "";
        matchHint.classList.remove("is-ok", "is-bad");
        return true;
    }
    const matches = regPassword.value === confirmPassword.value;
    matchHint.textContent = matches ? "Passwords match" : "Passwords do not match";
    matchHint.classList.toggle("is-ok", matches);
    matchHint.classList.toggle("is-bad", !matches);
    return matches;
}

if(confirmPassword){
    confirmPassword.addEventListener("input", checkPasswordMatch);
    regPassword.addEventListener("input", checkPasswordMatch);
}

/*=====================================*/
/* SAVE PROFILE TO FIRESTORE           */
/*=====================================*/


async function assertNotSuspended(uid){
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            const data = snap.data() || {};
            const until = data.suspendedUntil ? new Date(data.suspendedUntil) : null;
            const currentlySuspended = data.suspended === true
                && (!until || Number.isNaN(until.getTime()) || until.getTime() > Date.now());
            if (currentlySuspended) {
                try { await auth.signOut(); } catch (_) {}
                throw Object.assign(new Error("Account suspended"), { code: "homefinder/suspended" });
            }
        }
    } catch (e) {
        if (e && e.code === "homefinder/suspended") throw e;
        // If read fails, do not block login hard — rules may lag
        console.warn("assertNotSuspended", e);
    }
}

async function saveUserProfile(uid, profile){
    const ref = doc(db, "users", uid);
    const fullName = [profile.firstName, profile.middleInitial, profile.surname, profile.suffix]
        .map(s => (s || "").trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const payload = {
                ...profile,
                phoneDigits: String(profile.phone || "").replace(/\D/g, ""),
                displayName: fullName || profile.firstName || ""
            };
            // Defaults for new accounts (merge-safe; won't wipe existing if already set)
            if (payload.idVerification == null) payload.idVerification = { status: "none" };
            if (payload.status == null) payload.status = "active";
            if (payload.accountType && !["owner", "seeker", "broker"].includes(payload.accountType)) {
                payload.accountType = "seeker";
            }
            await setDoc(ref, payload, { merge: true });
            try {
                if (auth.currentUser && fullName) {
                    await updateProfile(auth.currentUser, { displayName: fullName });
                }
            } catch (_) {}
            return;
        } catch (err) {
            lastErr = err;
            console.warn("saveUserProfile attempt", attempt, err);
            await new Promise(r => setTimeout(r, 800 * attempt));
        }
    }
    throw lastErr || new Error("Could not save profile");
}

/*=====================================*/
/* REGISTER SUBMIT (email/password)    */
/*=====================================*/

const registerForm = document.getElementById("register-form");
if(registerForm){
    registerForm.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const submitBtn = document.getElementById("register-submit");

        // Re-entrancy guard: disable immediately, synchronously, before any
        // async work at all -- previously the button stayed clickable all
        // the way through the (async) phoneAlreadyTaken() network check
        // below, so rapid double/triple-taps during that gap could each
        // independently kick off a real createUserWithEmailAndPassword
        // call and duplicate downstream writes for the same email.
        if (submitBtn?.disabled) return;
        setLoading(submitBtn, true);

    if (!mustAgreeTerms()) { setLoading(submitBtn, false); return; }

        if(!checkPasswordMatch()){
            confirmPassword.focus();
            setLoading(submitBtn, false);
            return;
        }

        const email = document.getElementById("email").value.trim();
        const password = regPassword.value;

        // Minimal register: role + email + password only.
        // Name, phone, address, gender → edit profile after login.
        const profile = {
            email: email,
            accountType: (document.querySelector('input[name="account-type"]:checked') || {}).value || "seeker",
            canonicalRole: "seeker",
            idVerification: { status: "none" },
            status: "active",
            profileComplete: false,
            createdAt: new Date().toISOString()
        };

        // CORE: broker is never chosen at registration
        profile.canonicalRole = normalizeCanonicalRole(profile.accountType) || "seeker";
        if (!["owner", "seeker"].includes(profile.accountType)) {
            profile.accountType = "seeker";
            profile.canonicalRole = "seeker";
        }

        typeStatus("register-status", "Creating your account...");

        let createdUser = null;

        try {
            const result = await withTimeout(
                createUserWithEmailAndPassword(auth, email, password),
                15000, "Creating your account"
            );
            createdUser = result.user;
        } catch(error){
            clearStatus("register-status");
            showToast("error","Registration failed", friendlyError(error));
            setLoading(submitBtn, false);
            return;
        }

        try {
            typeStatus("register-status", "Sending verification email...");
            await withTimeout(
                sendEmailVerification(createdUser, verifyEmailActionCodeSettings),
                15000, "Sending the verification email"
            );
        } catch(error){
            console.error("Verification email failed:", error);
            showToast("info","Account created", "We couldn't send the verification email right now, but your account is ready.");
        }

        try {
            typeStatus("register-status", "Saving your profile...");
            await withTimeout(saveUserProfile(createdUser.uid, profile), 25000, "Saving your profile");
        } catch(error){
            console.error("Profile save failed:", error);
            // TEMPORARY diagnostic: showing the raw error so it's visible
            // without needing DevTools open. Revert to the friendlier
            // generic message once the real cause is confirmed fixed.
            showToast("info","Account created (profile save failed)",
                `Error: ${error.code || "no code"} -- ${error.message || error}`);
            setLoading(submitBtn, false);
            setTimeout(()=>{ window.location.href = "login.html"; }, 6000);
            return;
        }

        typeStatus("register-status", "Welcome to HomeFinder!");
        showToast("success","Verify your email", `We sent a confirmation link to ${email}. Open it to verify, then log in. If you don't see it within a few minutes, please check your Spam or Junk folder (and Promotions).`);
        setLoading(submitBtn, false);
        setTimeout(()=>{ window.location.href = "login.html"; }, 2200);
    });
}

/*=====================================*/
/* LOGIN SUBMIT (email/password)       */
/*=====================================*/

const loginForm = document.getElementById("login-form");
if(loginForm){
    loginForm.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const submitBtn = document.getElementById("login-submit");
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        setLoading(submitBtn, true);
        typeStatus("login-status", "Verifying your credentials...");

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);

            // Google/Facebook accounts don't get this check -- their
            // provider already vouches for the email (see
            // handleSocialLogin below, which never touches
            // emailVerified at all).
            if(!result.user.emailVerified){
                try {
                    await sendEmailVerification(result.user, verifyEmailActionCodeSettings);
                } catch(resendError){
                    // Not fatal -- they may have just been sent one
                    // moments ago and Firebase is rate-limiting resends.
                    // Either way, still block the login below.
                    console.warn("Couldn't resend verification email:", resendError);
                }

                await signOut(auth);

                clearStatus("login-status");
                showToast("error", "Verify your email first",
                    `We sent another confirmation link to ${email}. Please verify before logging in. If it's not in your inbox, check Spam / Junk (and Promotions).`);
                setLoading(submitBtn, false);
                return;
            }

            await assertNotSuspended(result.user.uid);

            showToast("success","Welcome back!", "You've been logged in successfully.");
            typeStatus("login-status", "Login successful. Redirecting...");
            setTimeout(()=>{ try { sessionStorage.removeItem("hf_hide_setup_banner"); } catch (_) {}
        postAuthRedirect("profile.html"); }, 1500);

        } catch(error){
            clearStatus("login-status");
            showToast("error","Login failed", friendlyError(error));
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

/*=====================================*/
/* SOCIAL LOGIN                        */
/*=====================================*/

async function handleSocialLogin(provider, providerName, statusId){
    typeStatus(statusId, `Connecting to ${providerName}...`);
    showToast("info", `${providerName} sign-in`, "A popup window has opened for verification.");

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Prefer account-type selected on the register form when present.
        // Login page has no radios — leave accountType unset so profile.html
        // can prompt (see promptForAccountType in profile-data.js).
        const typeRadio = document.querySelector('input[name="account-type"]:checked');
        const selectedType = typeRadio ? typeRadio.value : null;

        const profile = {
            firstName: user.displayName ? user.displayName.split(" ")[0] : "",
            email: user.email,
            provider: providerName,
            profileComplete: false,
            createdAt: new Date().toISOString()
        };
        if(selectedType && ["owner","seeker"].includes(selectedType)){
            profile.accountType = selectedType;
            profile.canonicalRole = normalizeCanonicalRole(selectedType);
        }

        // Merge only — never wipe an existing accountType on re-login
        await saveUserProfile(user.uid, profile);

        typeStatus(statusId, `Signed in as ${user.displayName || user.email}`);
        showToast("success", `${providerName} verified`, "You're successfully signed in.");

        setTimeout(()=>{ try { sessionStorage.removeItem("hf_hide_setup_banner"); } catch (_) {}
        postAuthRedirect("profile.html"); }, 1500);

    } catch(error){
        clearStatus(statusId);
        showToast("error", `${providerName} sign-in failed`, friendlyError(error));
    }
}

const googleLoginBtn = document.getElementById("google-login");

function mustAgreeTerms() {
    const agree = document.getElementById("register-agree");
    if (agree && !agree.checked) {
        showToast("error", "Terms required", "Please agree to the Terms of Service and Privacy Policy to continue.");
        return false;
    }
    return true;
}

const googleRegisterBtn = document.getElementById("google-register");
const facebookLoginBtn = document.getElementById("facebook-login");
const facebookRegisterBtn = document.getElementById("facebook-register");

if(googleLoginBtn){
    googleLoginBtn.addEventListener("click", ()=>{
        handleSocialLogin(googleProvider, "Google", "login-status");
    });
}
if(googleRegisterBtn){
    googleRegisterBtn.addEventListener("click", ()=>{
        if (!mustAgreeTerms()) return;
        handleSocialLogin(googleProvider, "Google", "register-status");
    });
}
if(facebookLoginBtn){
    facebookLoginBtn.addEventListener("click", ()=>{
        handleSocialLogin(facebookProvider, "Facebook", "login-status");
    });
}
if(facebookRegisterBtn){
    facebookRegisterBtn.addEventListener("click", ()=>{
        if (!mustAgreeTerms()) return;
        handleSocialLogin(facebookProvider, "Facebook", "register-status");
    });
}