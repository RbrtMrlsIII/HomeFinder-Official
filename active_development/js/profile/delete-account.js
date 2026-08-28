/* Delete account — SoT: user self-serve + admin.
   Confirm → flag Firestore profile → Auth deleteUser (reauth if needed).
   Platform: Firebase Auth + Firestore users/{uid}. */
import { auth, db } from "../firebase.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showAlert, showConfirm, showPrompt } from "./ui-dialog.js";

export async function confirmAndDeleteAccount() {
  const user = auth.currentUser;
  if (!user) {
    await showAlert("Sign in again to delete your account.", { title: "Not signed in" });
    return;
  }

  const ok = await showConfirm(
    "This removes your login. Listings and messages may remain for records until staff purge. Continue?",
    { title: "Delete account permanently?", okText: "Delete", cancelText: "Cancel" }
  );
  if (!ok) return;

  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        accountDeleted: true,
        accountDeletedAt: serverTimestamp(),
        showBasicInfo: false,
        showEmail: false,
        showPhone: false
      },
      { merge: true }
    );

    try {
      await deleteUser(user);
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/requires-recent-login") {
        const pwd = await showPrompt(
          "For security, enter your password to finish deleting this account.",
          { title: "Confirm password", placeholder: "Password" }
        );
        if (!pwd) {
          await showAlert(
            "Account was marked for deletion but login was not removed. Contact support if needed.",
            { title: "Cancelled" }
          );
          return;
        }
        if (!user.email) {
          await showAlert(
            "Sign out, sign in again, then retry Delete account. Or contact support.",
            { title: "Re-auth required" }
          );
          return;
        }
        const cred = EmailAuthProvider.credential(user.email, pwd);
        await reauthenticateWithCredential(user, cred);
        await deleteUser(user);
      } else {
        throw err;
      }
    }

    await showAlert("Your login has been removed. Redirecting home…", { title: "Account deleted" });
    window.location.href = "index.html";
  } catch (e) {
    console.error(e);
    await showAlert(e?.message || String(e), { title: "Could not delete account" });
  }
}
