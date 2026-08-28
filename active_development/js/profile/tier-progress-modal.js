import { user, db } from "./core.js";
import { getRole } from "./role.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { lockBodyScroll, unlockBodyScroll } from "./body-scroll-lock.js";
import {
    SEEKER_TIERS, OWNER_TIERS, BROKER_TIERS, tierIndexFromPoints
} from "../tiers.js";

export async function openTierProgressModal() {
    let modal = document.getElementById("tier-progress-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "tier-progress-modal";
        modal.className = "law-modal";
        modal.innerHTML = `
          <div class="law-modal-backdrop" id="tier-prog-backdrop"></div>
          <div class="law-modal-panel tier-progress-panel">
            <header class="law-modal-header">
              <div><h2>Tier progress</h2>
              <p class="law-modal-sub">Organic rank from contracts & admin adjustments</p></div>
              <button type="button" class="law-modal-close" id="tier-prog-close">&times;</button>
            </header>
            <div id="tier-prog-body" class="tier-prog-body"></div>
          </div>`;
        document.body.appendChild(modal);
        const close = () => {
            modal.classList.remove("active");
            unlockBodyScroll();
        };
        document.getElementById("tier-prog-close").onclick = close;
        document.getElementById("tier-prog-backdrop").onclick = close;
    }
    const body = document.getElementById("tier-prog-body");
    body.innerHTML = `<p class="field-hint">Loading…</p>`;
    modal.classList.add("active");
    lockBodyScroll();

    const role = await getRole();
    const ladder = role === "owner" ? OWNER_TIERS : role === "broker" ? BROKER_TIERS : SEEKER_TIERS;
    const tierRole = role === "broker" ? "broker" : role;
    let pts = 0;
    try {
        const snap = await getDoc(doc(db, "users", user.uid, "tier", tierRole));
        if (snap.exists()) pts = Number(snap.data().totalPoints) || 0;
    } catch (_) {}
    const idx = tierIndexFromPoints(pts, ladder);
    const cur = ladder[idx] || ladder[0];
    const next = ladder[idx + 1];
    const span = next ? (next.min - cur.min) || 1 : 1;
    const into = next ? Math.min(span, Math.max(0, pts - cur.min)) : span;
    const pct = next ? Math.round((into / span) * 100) : 100;

    body.innerHTML = `
      <div class="tier-prog-summary">
        <div class="tier-prog-current">${cur.name}</div>
        <div class="tier-prog-pts"><strong>${pts}</strong> points</div>
        <p class="field-hint">${next ? `${Math.max(0, next.min - pts)} pts to ${next.name}` : "Highest tier reached"}</p>
        <div class="cooldown-bar-track" style="height:12px;margin:10px 0;">
          <div class="cooldown-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="tier-prog-ladder">
        ${ladder.map((t, i) => `
          <div class="tier-prog-step ${i === idx ? "is-current" : ""} ${i < idx ? "is-done" : ""}">
            <div class="tier-prog-ring">${i}</div>
            <div>
              <strong>${t.name}</strong>
              <div class="field-hint">${t.min}+ points</div>
            </div>
          </div>`).join("")}
      </div>
      <p class="field-hint" style="margin-top:12px;">Boost packages are separate — they do not change Tier rank.</p>`;
}