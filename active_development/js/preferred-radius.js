/* Phase 9 — Preferred discovery / service radius (SoT §30)
 * preferred ≤ entitlement max (tier + boost). Does not bypass cooldown.
 */
import { radiusForTier } from "./tiers.js";

const LS_MARKET = "hf_preferred_radius_km";
const LS_HQ = "hf_preferred_service_radius_km";

export function entitlementMaxKm(tierIndex, packageId = 0) {
  return radiusForTier(Number(tierIndex) || 0, Number(packageId) || 0) || 2;
}

export function readPreferred(kind = "market") {
  try {
    const key = kind === "hq" ? LS_HQ : LS_MARKET;
    const n = Number(localStorage.getItem(key));
    if (Number.isFinite(n) && n > 0) return n;
  } catch (_) {}
  return null;
}

export function writePreferred(km, kind = "market") {
  try {
    const key = kind === "hq" ? LS_HQ : LS_MARKET;
    localStorage.setItem(key, String(km));
  } catch (_) {}
}

/** Effective radius: clamp preferred to [0.5, maxKm] */
export function effectiveRadiusKm(maxKm, preferredKm = null, kind = "market") {
  const max = Math.max(0.5, Number(maxKm) || 2);
  let pref = preferredKm != null ? Number(preferredKm) : readPreferred(kind);
  if (!Number.isFinite(pref) || pref <= 0) pref = max;
  return Math.min(max, Math.max(0.5, pref));
}

/**
 * Mount a polished radius control into `host`.
 * @param {object} opts
 * @param {HTMLElement} opts.host
 * @param {() => number} opts.getMaxKm
 * @param {(km: number) => void} opts.onChange
 * @param {"market"|"hq"} opts.kind
 * @param {string} [opts.label]
 */
export function mountPreferredRadiusControl({
  host,
  getMaxKm,
  onChange,
  kind = "market",
  label = "Your radius"
}) {
  if (!host) return { destroy() {} };

  host.classList.add("pref-radius-control");
  host.innerHTML = `
    <div class="pref-radius-card">
      <div class="pref-radius-head">
        <div class="pref-radius-titles">
          <span class="pref-radius-label"><i class="bx bx-radar"></i> ${label}</span>
          <span class="pref-radius-sub" data-pr-sub>Adjust how wide you search — never beyond your tier max</span>
        </div>
        <div class="pref-radius-value-wrap">
          <span class="pref-radius-value" data-pr-value>—</span>
          <span class="pref-radius-unit">km</span>
        </div>
      </div>
      <div class="pref-radius-slider-row">
        <span class="pref-radius-min" data-pr-min>0.5</span>
        <input type="range" class="pref-radius-slider" data-pr-slider min="0.5" max="2" step="0.1" value="2" aria-label="${label}">
        <span class="pref-radius-max" data-pr-max>2</span>
      </div>
      <div class="pref-radius-meter" aria-hidden="true">
        <div class="pref-radius-meter-fill" data-pr-fill></div>
      </div>
      <div class="pref-radius-foot">
        <span class="pref-radius-cap" data-pr-cap>Max entitlement: — km</span>
        <button type="button" class="pref-radius-reset" data-pr-reset title="Use full tier radius">Use max</button>
      </div>
    </div>`;

  const slider = host.querySelector("[data-pr-slider]");
  const valueEl = host.querySelector("[data-pr-value]");
  const maxEl = host.querySelector("[data-pr-max]");
  const capEl = host.querySelector("[data-pr-cap]");
  const fillEl = host.querySelector("[data-pr-fill]");
  const resetBtn = host.querySelector("[data-pr-reset]");

  function paint() {
    const max = Math.max(0.5, Number(getMaxKm()) || 2);
    let cur = effectiveRadiusKm(max, readPreferred(kind), kind);
    slider.min = "0.5";
    slider.max = String(max);
    slider.step = max > 10 ? "0.5" : "0.1";
    slider.value = String(cur);
    if (valueEl) valueEl.textContent = Number(cur).toFixed(cur >= 10 ? 1 : 1);
    if (maxEl) maxEl.textContent = String(max);
    if (capEl) capEl.textContent = `Max entitlement: ${max} km · cooldown still applies on pin move`;
    if (fillEl) {
      const pct = ((cur - 0.5) / (max - 0.5)) * 100;
      fillEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    }
    return cur;
  }

  function commit(km) {
    const max = Math.max(0.5, Number(getMaxKm()) || 2);
    const next = effectiveRadiusKm(max, km, kind);
    writePreferred(next, kind);
    paint();
    onChange?.(next);
  }

  slider?.addEventListener("input", () => {
    const v = Number(slider.value);
    if (valueEl) valueEl.textContent = v.toFixed(1);
    if (fillEl) {
      const max = Number(slider.max) || 2;
      const pct = ((v - 0.5) / (max - 0.5)) * 100;
      fillEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    }
  });
  slider?.addEventListener("change", () => commit(Number(slider.value)));
  resetBtn?.addEventListener("click", () => commit(getMaxKm()));

  paint();
  return {
    paint,
    getKm: () => effectiveRadiusKm(getMaxKm(), readPreferred(kind), kind),
    destroy() {
      host.innerHTML = "";
    }
  };
}
