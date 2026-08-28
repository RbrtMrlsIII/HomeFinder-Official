/* F0 — Government financing disclaimers (SoT §34)
 * Separate chrome, not card body. Templates are admin-editable (Firestore config/govDisclaimers).
 */
import { db } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const DISCLAIMER_DOC = "govDisclaimers";
export const DISCLAIMER_PATH = ["config", DISCLAIMER_DOC];

/** Default templates — used until admin saves overrides */
export const DEFAULT_DISCLAIMERS = {
  global:
    "Government and socialized housing highlights on HomeFinder are informational only. This is not a loan offer, not financial advice, and not an application to Pag-IBIG, DHSUD, or any Key Shelter Agency.",
  pagibig:
    "HomeFinder is not Pag-IBIG Fund. Membership, interest rates, loan ceilings, and approval are decided only by Pag-IBIG. Always verify on official Pag-IBIG channels before you apply.",
  "4ph":
    "Expanded 4PH / DHSUD program rules and beneficiary qualification are set by the government and its partners. HomeFinder only shares public information and outbound links.",
  nha:
    "NHA projects follow NHA allocation and application rules. A card on HomeFinder is not an application slot or a reservation.",
  other:
    "Specialty housing programs (including NHMFC, SHFC, and others) have their own eligibility rules. Confirm directly with the agency before acting.",
  partner:
    "Developer or partner pages linked here are not automatically certified by HomeFinder. Prefer official government sites when checking eligibility.",
  updatedAt: null,
  updatedBy: null
};

export const SECTOR_LABELS = {
  global: "Global (Home & guide)",
  pagibig: "Pag-IBIG",
  "4ph": "4PH / DHSUD",
  nha: "NHA",
  other: "Other KSA / specialty",
  partner: "Developer partner"
};

export async function loadDisclaimers() {
  const base = { ...DEFAULT_DISCLAIMERS };
  try {
    const snap = await getDoc(doc(db, "config", DISCLAIMER_DOC));
    if (snap.exists()) {
      const d = snap.data() || {};
      for (const k of Object.keys(DEFAULT_DISCLAIMERS)) {
        if (k === "updatedAt" || k === "updatedBy") continue;
        if (typeof d[k] === "string" && d[k].trim()) base[k] = d[k].trim();
      }
      base.updatedAt = d.updatedAt || null;
      base.updatedBy = d.updatedBy || null;
    }
  } catch (e) {
    console.warn("gov disclaimers load", e);
  }
  return base;
}

export async function saveDisclaimers(partial, uid) {
  const current = await loadDisclaimers();
  const next = { ...current };
  for (const k of Object.keys(DEFAULT_DISCLAIMERS)) {
    if (k === "updatedAt" || k === "updatedBy") continue;
    if (typeof partial[k] === "string") next[k] = partial[k].trim();
  }
  next.updatedAt = new Date().toISOString();
  next.updatedBy = uid || null;
  await setDoc(
    doc(db, "config", DISCLAIMER_DOC),
    {
      global: next.global,
      pagibig: next.pagibig,
      "4ph": next["4ph"],
      nha: next.nha,
      other: next.other,
      partner: next.partner,
      updatedAt: next.updatedAt,
      updatedBy: next.updatedBy,
      savedAt: serverTimestamp()
    },
    { merge: true }
  );
  return next;
}

/** Render a disclaimer stack into a host element */
export function paintDisclaimerSection(host, disclaimers, { sectors = ["global"], title = "Disclaimers" } = {}) {
  if (!host) return;
  const keys = sectors.filter((k) => disclaimers[k]);
  host.innerHTML = `
    <aside class="gov-disclaimer-block" data-asset="gov-disclaimer-block" role="note">
      <h3 class="gov-disclaimer-title"><i class="bx bx-info-circle"></i> ${title}</h3>
      <ul class="gov-disclaimer-list">
        ${keys
          .map(
            (k) => `<li data-sector="${k}"><span class="gov-disclaimer-sector">${SECTOR_LABELS[k] || k}</span>
            <p>${escapeHtml(disclaimers[k])}</p></li>`
          )
          .join("")}
      </ul>
    </aside>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
