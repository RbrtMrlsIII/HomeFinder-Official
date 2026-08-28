/* Profile UI scale — full-page zoom (same idea as market hf_market_scale). */
const SCALE_KEY = "hf_profile_scale";

function defaultScale() {
  return 100;
}

function clamp(n) {
  n = Math.round(Number(n) || defaultScale());
  return Math.min(100, Math.max(50, n));
}

export function getProfileScale() {
  try {
    const raw = localStorage.getItem(SCALE_KEY);
    if (raw != null && raw !== "") return clamp(raw);
  } catch (_) {}
  return defaultScale();
}

export function applyProfileScale(n) {
  const v = clamp(n);
  const factor = v / 100;
  try {
    localStorage.setItem(SCALE_KEY, String(v));
  } catch (_) {}

  document.body.setAttribute("data-profile-scale", String(v));
  document.body.style.setProperty("--profile-ui-scale", String(factor));
  document.documentElement.style.setProperty("--profile-ui-scale", String(factor));

  const label = document.getElementById("profile-scale-value");
  if (label) label.textContent = String(v);
  const range = document.getElementById("profile-scale-range");
  if (range && String(range.value) !== String(v)) range.value = String(v);

  try {
    window.dispatchEvent(new Event("resize"));
  } catch (_) {}
  return v;
}

export function initProfileScale() {
  const v = applyProfileScale(getProfileScale());
  const range = document.getElementById("profile-scale-range");
  if (!range) return v;
  range.value = String(v);
  range.addEventListener("input", () => applyProfileScale(range.value));
  range.addEventListener("change", () => applyProfileScale(range.value));
  range.addEventListener("click", (e) => e.stopPropagation());
  range.addEventListener("mousedown", (e) => e.stopPropagation());
  range.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  return v;
}

initProfileScale();
