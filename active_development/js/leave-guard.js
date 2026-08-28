/**
 * Leave guard — dirty-state authority only.
 *
 * Cinematic routing owns in-app click interception and its visual confirmation.
 * This module therefore does not install a second click prompt. It only tracks
 * dirty forms and protects hard browser exits through beforeunload.
 */
(function () {
  const MSG = "You have unsaved changes. Leave this page?";
  let dirty = false;

  function setDirty(v) {
    dirty = !!v;
    try { document.body?.classList.toggle("hf-leave-dirty", dirty); } catch (_) {}
  }

  function markDirty() { setDirty(true); }
  function clearDirty() { setDirty(false); }

  window.hfLeaveGuard = {
    markDirty,
    clearDirty,
    isDirty: () => dirty,
    message: MSG,
  };

  function bindFormTracking() {
    document.addEventListener("input", (e) => {
      const t = e.target;
      if (!t?.closest || t.closest("[data-leave-safe]")) return;
      if (t.matches("input, textarea, select")) {
        if (t.type === "password" || t.type === "search") return;
        markDirty();
      }
    }, true);

    document.addEventListener("change", (e) => {
      const t = e.target;
      if (!t?.closest || t.closest("[data-leave-safe]")) return;
      if (t.matches("input, textarea, select")) markDirty();
    }, true);

    document.addEventListener("submit", (e) => {
      if (!e.defaultPrevented) clearDirty();
    }, true);
  }

  window.addEventListener("beforeunload", (e) => {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = MSG;
    return MSG;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindFormTracking, { once: true });
  } else {
    bindFormTracking();
  }
})();
