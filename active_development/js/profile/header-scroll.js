/* Profile header collapse — element FLIP + header HEIGHT FLIP (clay band eases) */
const fixedHeader = document.getElementById("profile-header");

const SCROLL_COLLAPSE = 160;
const SCROLL_EXPAND = 36;
const MIN_TOGGLE_MS = 480;
const FLIP_MS = 620;
const BOOT_SUPPRESS_MS = 2200;
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

let collapseTicking = false;
let collapsed = false;
let suppressCollapseUntil = Date.now() + BOOT_SUPPRESS_MS;
let lastToggleAt = 0;
let flipBusy = false;

function syncBodyPad(heightPx) {
  if (!fixedHeader) return;
  const h =
    heightPx != null
      ? heightPx
      : Math.max(fixedHeader.offsetHeight, 1);
  document.documentElement.style.setProperty("--header-height", h + "px");
  document.body.style.paddingTop = h + "px";
}

function scrollY() {
  const body = document.body;
  if (body && body.classList.contains("profile-page")) {
    const by = body.scrollTop || 0;
    if (by > 0) return by;
  }
  const se = document.scrollingElement || document.documentElement;
  return window.scrollY || window.pageYOffset || se.scrollTop || body?.scrollTop || 0;
}

function flipTargets() {
  const list = [
    document.querySelector("#profile-header .profile-user-image"),
    document.getElementById("profile-name-block"),
    document.getElementById("profile-badges"),
    /* .profile-tabs is deliberately NOT here (see note below). */
  ];
  const actions = document.querySelector("#profile-header .header-actions");
  if (actions) list.push(...Array.from(actions.children));
  return list.filter(Boolean);
}
/**
 * Why .profile-tabs isn't a FLIP target (it used to be, and that WAS the
 * "tabs don't follow the header height animation" bug):
 *
 * .profile-tabs is CSS `position: relative; flex: 0 0 auto` -- a normal-flow
 * child of the same shrinking container whose `height` runHeightFlip()
 * eases over FLIP_MS. That means the tabs bar already, continuously,
 * automatically slides with the header on every animation frame for free,
 * as a side effect of the container's own height transition -- exactly
 * "rides the clay band" per SoT §22.6. It never has a discontinuous CSS
 * class change the way the avatar/name/badges/action-balls do (those need
 * FLIP because their *own* internal layout jumps instantly when `.collapsed`
 * toggles -- e.g. actions going from a 2x2 grid to a 1x4 row -- and FLIP
 * papers over that jump with a translate). The tabs have no such jump to
 * paper over.
 *
 * Including it in flipTargets() added an EXTRA, unnecessary transform on
 * top of that already-correct native reflow -- and the delta for that
 * transform was measured at the wrong moment: setCollapsed() measured
 * "after" positions right after runHeightFlip() had *pinned the header's
 * height back down to beforeH* (to set up the ease), not after the true
 * collapsed layout -- so the extra transform was also numerically wrong,
 * not just redundant. Two conflicting motions on the same element is
 * exactly what read as "tabs aren't following the header" / visible
 * overlap mid-transition.
 */

function clearFlipStyles(els) {
  els.forEach((el) => {
    el.style.transition = "";
    el.style.transform = "";
  });
}

function clearHeaderHeightStyles() {
  if (!fixedHeader) return;
  fixedHeader.style.height = "";
  fixedHeader.style.transition = "";
  document.body.style.transition = "";
}

/**
 * Animate clay band height (the missing piece).
 * Content reflow is instant; we pin height before→after and ease it.
 */
function runHeightFlip(beforeH, afterH, reduce) {
  if (!fixedHeader || reduce) {
    syncBodyPad();
    fixedHeader?.classList.remove("is-height-flipping");
    return;
  }
  if (Math.abs(beforeH - afterH) < 1) {
    syncBodyPad(afterH);
    fixedHeader.classList.remove("is-height-flipping");
    return;
  }

  fixedHeader.classList.add("is-height-flipping");
  fixedHeader.style.transition = "none";
  fixedHeader.style.height = beforeH + "px";
  document.body.style.transition = "none";
  document.body.style.paddingTop = beforeH + "px";
  void fixedHeader.offsetHeight;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fixedHeader.style.transition = `height ${FLIP_MS}ms ${EASE}`;
      fixedHeader.style.height = afterH + "px";
      document.body.style.transition = `padding-top ${FLIP_MS}ms ${EASE}`;
      document.body.style.paddingTop = afterH + "px";
      document.documentElement.style.setProperty("--header-height", afterH + "px");
    });
  });
}

function setCollapsed(next, { force } = {}) {
  if (!fixedHeader) return;
  if (!force && next === collapsed) return;
  if (flipBusy && !force) return;

  const reduce =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1) Measure header shell + children BEFORE layout change */
  const beforeH = Math.max(fixedHeader.offsetHeight, 1);
  const els = flipTargets();
  const before = els.map((el) => el.getBoundingClientRect());

  /* 2) Apply collapsed layout with height unlocked */
  clearHeaderHeightStyles();
  collapsed = next;
  fixedHeader.classList.toggle("collapsed", next);
  document.body.classList.toggle("header-collapsed", next);
  lastToggleAt = Date.now();

  void fixedHeader.offsetHeight; /* force reflow */
  const afterH = Math.max(fixedHeader.offsetHeight, 1);

  if (reduce) {
    syncBodyPad(afterH);
    return;
  }

  flipBusy = true;

  /* 3) Height FLIP on the clay band + body pad (same duration) */
  runHeightFlip(beforeH, afterH, false);

  /* 4) Translate FLIP on identity + action cells */
  const after = els.map((el) => el.getBoundingClientRect());
  els.forEach((el, i) => {
    const b = before[i];
    const a = after[i];
    if (!b || !a) return;
    const dx = b.left - a.left;
    const dy = b.top - a.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      els.forEach((el) => {
        el.style.transition = `transform ${FLIP_MS}ms ${EASE}`;
        el.style.transform = "translate(0, 0)";
      });
    });
  });

  window.setTimeout(() => {
    clearFlipStyles(els);
    clearHeaderHeightStyles();
    fixedHeader.classList.remove("is-height-flipping");
    syncBodyPad(); /* natural height */
    flipBusy = false;
  }, FLIP_MS + 64);
}

function expandHeader() {
  suppressCollapseUntil = Date.now() + 900;
  setCollapsed(false, { force: true });
}

function applyHeaderCollapse() {
  if (!fixedHeader) return;
  const y = scrollY();
  const now = Date.now();
  if (now < suppressCollapseUntil) {
    if (collapsed) {
      collapsed = false;
      clearHeaderHeightStyles();
      fixedHeader.classList.remove("collapsed");
      document.body.classList.remove("header-collapsed");
      syncBodyPad();
    }
    collapseTicking = false;
    return;
  }
  if (now - lastToggleAt < MIN_TOGGLE_MS) {
    collapseTicking = false;
    return;
  }
  if (!collapsed && y > SCROLL_COLLAPSE) setCollapsed(true);
  else if (collapsed && y < SCROLL_EXPAND) setCollapsed(false);
  collapseTicking = false;
}

function updateHeaderCollapse() {
  if (collapseTicking || flipBusy) return;
  collapseTicking = true;
  requestAnimationFrame(applyHeaderCollapse);
}

function resetScrollTop() {
  try {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo(0, 0);
  } catch (_) {}
}

window.addEventListener("scroll", updateHeaderCollapse, { passive: true });
document.addEventListener("scroll", updateHeaderCollapse, { passive: true, capture: true });
document.body?.addEventListener("scroll", updateHeaderCollapse, { passive: true });
window.addEventListener("resize", () => {
  if (!flipBusy) {
    clearHeaderHeightStyles();
    syncBodyPad();
  }
  updateHeaderCollapse();
});

if (fixedHeader && typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => {
    if (!flipBusy) syncBodyPad();
  }).observe(fixedHeader);
}

function bootExpanded() {
  resetScrollTop();
  collapsed = false;
  clearHeaderHeightStyles();
  fixedHeader?.classList.remove("collapsed");
  document.body.classList.remove("header-collapsed");
  suppressCollapseUntil = Date.now() + BOOT_SUPPRESS_MS;
  syncBodyPad();
}

requestAnimationFrame(() => {
  bootExpanded();
  requestAnimationFrame(bootExpanded);
});
window.addEventListener("pageshow", bootExpanded);
window.addEventListener("load", () => {
  bootExpanded();
  setTimeout(bootExpanded, 100);
  setTimeout(bootExpanded, 400);
});

document.addEventListener("click", (e) => {
  if (e.target.closest(".profile-tab")) expandHeader();
});

export { syncBodyPad, expandHeader };
