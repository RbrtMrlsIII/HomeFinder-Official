/* Phase 5 — Broker successful assists portfolio (SoT §27b)
 * Self (broker): full history at bottom of Perks portfolio
 * Visitor: compact strip under header (no private client PII)
 */
import { user, db } from "./core.js";
import { getRole } from "./role.js";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function whenOf(r) {
  try {
    if (r.successfulAt?.toDate) return r.successfulAt.toDate();
    if (typeof r.successfulAt === "string") return new Date(r.successfulAt);
    if (r.updatedAt) return new Date(r.updatedAt);
  } catch (_) {}
  return null;
}

function formatWhen(d) {
  if (!d || Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch (_) {
    return d.toISOString().slice(0, 10);
  }
}

export async function fetchSuccessfulAssists(brokerUid, max = 40) {
  if (!brokerUid) return [];
  const out = [];
  try {
    // Prefer equality filters that work without composite indexes
    const qy = query(
      collection(db, "assistanceRequests"),
      where("claimedBy", "==", brokerUid),
      where("status", "==", "successful_assist"),
      limit(max)
    );
    const snap = await getDocs(qy);
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("successful assists query", e);
    // Fallback: claimedBy only, filter client-side
    try {
      const snap = await getDocs(
        query(collection(db, "assistanceRequests"), where("claimedBy", "==", brokerUid), limit(80))
      );
      snap.forEach((d) => {
        const x = d.data() || {};
        if (String(x.status) === "successful_assist") out.push({ id: d.id, ...x });
      });
    } catch (e2) {
      console.warn("assists fallback", e2);
    }
  }
  out.sort((a, b) => {
    const ta = whenOf(a)?.getTime() || 0;
    const tb = whenOf(b)?.getTime() || 0;
    return tb - ta;
  });
  return out;
}

/** Compact proof under header — safe for visitors */
export function renderAssistsStrip(items, { visitor = false } = {}) {
  const strip = document.getElementById("profile-assists-strip");
  if (!strip) return;
  if (!items.length) {
    strip.hidden = true;
    strip.innerHTML = "";
    return;
  }
  strip.hidden = false;
  const n = items.length;
  const recent = items.slice(0, 3);
  const chips = recent
    .map((r) => {
      const type = String(r.type || r.helpType || "assist").replace(/_/g, " ");
      const when = formatWhen(whenOf(r));
      // No poster names / payment refs on public strip
      return `<span class="assists-chip" title="${esc(type)}">${esc(type)}${when ? " · " + esc(when) : ""}</span>`;
    })
    .join("");
  strip.innerHTML = `
    <div class="assists-strip-inner">
      <span class="assists-strip-count"><i class="bx bx-badge-check"></i> ${n} successful assist${n === 1 ? "" : "s"}</span>
      <div class="assists-strip-chips">${chips}</div>
      ${visitor && n > 3 ? `<span class="assists-strip-more">+${n - 3} more</span>` : ""}
    </div>`;
}

/** Full history for broker self — bottom of portfolio */
export function renderAssistsHistory(items) {
  const section = document.getElementById("broker-assists-history");
  const list = document.getElementById("broker-assists-history-list");
  if (!section || !list) return;
  if (!items.length) {
    section.hidden = false;
    list.innerHTML = `<p class="field-hint">No successful assists yet. Complete an assist from Broker HQ → Contracts → Mark assist complete.</p>`;
    return;
  }
  section.hidden = false;
  list.innerHTML = `<ul class="assists-history-ul">${items
    .map((r) => {
      const type = String(r.type || r.helpType || "assistance").replace(/_/g, " ");
      const title = r.title || r.summary || "Assistance";
      const when = formatWhen(whenOf(r)) || "—";
      const area =
        r.lat != null && r.lng != null
          ? `${Number(r.lat).toFixed(2)}, ${Number(r.lng).toFixed(2)}`
          : "";
      return `<li class="assists-history-row">
        <div class="assists-history-main">
          <strong>${esc(type)}</strong>
          <span class="assists-history-title">${esc(title)}</span>
        </div>
        <div class="assists-history-meta">
          <time>${esc(when)}</time>
          ${area ? `<span class="assists-history-area">${esc(area)}</span>` : ""}
        </div>
      </li>`;
    })
    .join("")}</ul>`;
}

export async function bootBrokerAssistsSelf() {
  if (!user) return;
  let role = "seeker";
  try {
    role = (await getRole()) || "seeker";
  } catch (_) {}
  if (role !== "broker" && role !== "agent") {
    const section = document.getElementById("broker-assists-history");
    if (section) section.hidden = true;
    const strip = document.getElementById("profile-assists-strip");
    if (strip) strip.hidden = true;
    return;
  }
  const items = await fetchSuccessfulAssists(user.uid);
  renderAssistsStrip(items, { visitor: false });
  renderAssistsHistory(items);
}

/** Visitor viewing a broker profile */
export async function bootBrokerAssistsVisitor(brokerUid) {
  if (!brokerUid) return;
  const items = await fetchSuccessfulAssists(brokerUid);
  renderAssistsStrip(items, { visitor: true });
  // Also inject under visitor about if header strip was cleared
  const aboutBadges = document.getElementById("visitor-badges");
  if (aboutBadges && items.length) {
    let host = document.getElementById("visitor-assists-under");
    if (!host) {
      host = document.createElement("div");
      host.id = "visitor-assists-under";
      host.className = "profile-assists-strip visitor-assists-under";
      aboutBadges.parentElement?.appendChild(host);
    }
    host.hidden = false;
    const n = items.length;
    host.innerHTML = `<div class="assists-strip-inner">
      <span class="assists-strip-count"><i class="bx bx-badge-check"></i> ${n} successful assist${n === 1 ? "" : "s"}</span>
    </div>`;
  }
}

// Self boot (skip pure visitor mode)
if (!document.body.classList.contains("visitor-mode")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => bootBrokerAssistsSelf().catch(console.warn), 400);
    });
  } else {
    setTimeout(() => bootBrokerAssistsSelf().catch(console.warn), 400);
  }
}

document.addEventListener("hf:tab-activated", (e) => {
  if (e.detail?.tab === "perks" || e.detail?.tab === "portfolio") {
    bootBrokerAssistsSelf().catch(console.warn);
  }
});
