/**
 * Reference-counted body scroll lock.
 * Profile uses body as scrollport — never leave overflow:hidden stuck.
 */
let lockCount = 0;

function applyLock() {
  document.body.classList.add("u-body-lock");
  document.documentElement.classList.add("u-body-lock");
  document.body.style.setProperty("overflow", "hidden");
  document.documentElement.style.setProperty("overflow", "hidden");
}

function applyUnlock() {
  document.body.classList.remove("u-body-lock");
  document.documentElement.classList.remove("u-body-lock");
  document.documentElement.classList.remove("profile-modal-open");
  document.body.classList.remove("modal-open");
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("overflow");
  document.body.style.removeProperty("overflow-y");
  document.documentElement.style.removeProperty("overflow-y");
  /* Restore profile scrollport if CSS classes alone are not enough */
  if (document.body.classList.contains("profile-page")) {
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";
    document.documentElement.style.overflow = "hidden";
  }
}

export function lockBodyScroll() {
  lockCount += 1;
  if (lockCount === 1) applyLock();
  return lockCount;
}

export function unlockBodyScroll() {
  if (lockCount > 0) lockCount -= 1;
  if (lockCount === 0) applyUnlock();
  return lockCount;
}

export function forceUnlockBodyScroll() {
  lockCount = 0;
  applyUnlock();
}

export function getBodyScrollLockCount() {
  return lockCount;
}

forceUnlockBodyScroll();
requestAnimationFrame(() => forceUnlockBodyScroll());
setTimeout(() => forceUnlockBodyScroll(), 50);
setTimeout(() => forceUnlockBodyScroll(), 300);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") forceUnlockBodyScroll();
});
window.addEventListener("pageshow", () => forceUnlockBodyScroll());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") forceUnlockBodyScroll();
});
