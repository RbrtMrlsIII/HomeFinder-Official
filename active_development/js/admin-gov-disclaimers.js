/* F0 — Admin editor for government disclaimer templates */
import { authReady } from "./session.js";
import { isOpsUid } from "./admin-uid.js";
import {
  loadDisclaimers,
  saveDisclaimers,
  DEFAULT_DISCLAIMERS,
  SECTOR_LABELS
} from "./gov-disclaimers.js";

const KEYS = ["global", "pagibig", "4ph", "nha", "other", "partner"];

function $(id) {
  return document.getElementById(id);
}

function escape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function refresh() {
  const form = $("admin-disclaimer-form");
  if (!form) return;
  const data = await loadDisclaimers();
  form.innerHTML = KEYS.map(
    (k) => `<label>${SECTOR_LABELS[k] || k}
      <textarea data-key="${k}" maxlength="1200">${escape(data[k] || DEFAULT_DISCLAIMERS[k] || "")}</textarea>
    </label>`
  ).join("");
  const meta = $("admin-disclaimer-meta");
  if (meta) {
    meta.textContent = data.updatedAt
      ? `Last saved: ${data.updatedAt}${data.updatedBy ? " · " + data.updatedBy : ""}`
      : "Using built-in defaults until you save.";
  }
}

$("admin-disclaimer-save")?.addEventListener("click", async () => {
  const status = $("admin-disclaimer-status");
  const user = await authReady.catch(() => null);
  if (!user || !isOpsUid(user.uid)) {
    if (status) status.textContent = "Ops login required.";
    return;
  }
  const partial = {};
  document.querySelectorAll("#admin-disclaimer-form textarea[data-key]").forEach((ta) => {
    partial[ta.getAttribute("data-key")] = ta.value;
  });
  try {
    if (status) status.textContent = "Saving…";
    await saveDisclaimers(partial, user.uid);
    if (status) status.textContent = "Saved. Guide page will load these templates.";
    await refresh();
  } catch (e) {
    if (status) status.textContent = "Save failed: " + (e.message || e);
  }
});

// Hook existing admin tab buttons (data-tab)
document.querySelectorAll(".admin-tab-btn[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.getAttribute("data-tab") === "gov-disclaimers") {
      setTimeout(refresh, 50);
    }
  });
});

authReady.then((u) => {
  if (u && isOpsUid(u.uid)) refresh();
}).catch(() => {});
