/* HomeFinder shared transition compatibility bridge. Cinematic routing owns motion; theme state comes from data-environment. */
const legacyNavigate = (href) => {
  try { window.location.assign(href); }
  catch (_) { window.location.href = href; }
};

if (!window.goTo) {
  window.goTo = (href) => {
    if (window.hfCinematic?.navigate) return window.hfCinematic.navigate(href);
    return legacyNavigate(href);
  };
}

window.addEventListener("hf:cinematic-ready", () => {
  // Replace the compatibility fallback once the cinematic runtime is ready.
  window.goTo = (href) => window.hfCinematic.navigate(href);
}, { once: true });
