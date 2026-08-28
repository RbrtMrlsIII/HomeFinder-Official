/* F1a — Admin CRUD for government housing program posts */
import { authReady } from "./session.js";
import { isOpsUid } from "./admin-uid.js";
import {
  SECTORS,
  defaultExpiresAt,
  listAllPosts,
  createPost,
  updatePost,
  setPostStatus,
  removePost,
  expireOverduePosts,
  isExpired
} from "./gov-housing-posts.js";

function $(id) {
  return document.getElementById(id);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

let editingId = null;

function formPayload() {
  return {
    title: $("gh-title")?.value || "",
    sector: $("gh-sector")?.value || "other",
    imageUrl: $("gh-image")?.value || "",
    externalUrl: $("gh-url")?.value || "",
    locationText: $("gh-location")?.value || "",
    priceBand: $("gh-band")?.value || "unknown",
    partnerName: $("gh-partner")?.value || "",
    opsVerified: !!$("gh-ops-verified")?.checked,
    expiresAt: $("gh-expires")?.value
      ? new Date($("gh-expires").value).toISOString()
      : defaultExpiresAt(),
    status: $("gh-status")?.value || "draft"
  };
}

function fillForm(p) {
  editingId = p?.id || null;
  if ($("gh-title")) $("gh-title").value = p?.title || "";
  if ($("gh-sector")) $("gh-sector").value = p?.sector || "pagibig";
  if ($("gh-image")) $("gh-image").value = p?.imageUrl || "";
  if ($("gh-url")) $("gh-url").value = p?.externalUrl || "";
  if ($("gh-location")) $("gh-location").value = p?.locationText || "";
  if ($("gh-band")) $("gh-band").value = p?.priceBand || "unknown";
  if ($("gh-partner")) $("gh-partner").value = p?.partnerName || "";
  if ($("gh-ops-verified")) $("gh-ops-verified").checked = !!p?.opsVerified;
  if ($("gh-status")) $("gh-status").value = p?.status || "draft";
  if ($("gh-expires")) {
    const iso = p?.expiresAt || defaultExpiresAt();
    $("gh-expires").value = iso.slice(0, 16);
  }
  if ($("gh-form-title")) {
    $("gh-form-title").textContent = editingId ? "Edit program post" : "New program post (free)";
  }
}

function clearForm() {
  fillForm({
    title: "",
    sector: "pagibig",
    imageUrl: "",
    externalUrl: "",
    locationText: "",
    priceBand: "unknown",
    status: "draft",
    expiresAt: defaultExpiresAt()
  });
  editingId = null;
  if ($("gh-form-title")) $("gh-form-title").textContent = "New program post (free)";
}

async function refreshList() {
  const host = $("gh-posts-list");
  if (!host) return;
  host.innerHTML = `<p class="admin-panel-sub">Loading…</p>`;
  try {
    const rows = await listAllPosts(80);
    if (!rows.length) {
      host.innerHTML = `<p class="admin-panel-sub">No government program posts yet. Create one below (free for ops).</p>`;
      return;
    }
    host.innerHTML = `<div class="admin-table-wrap"><table class="admin-table ops-sheet">
      <thead><tr>
        <th>Title</th><th>Sector</th><th>Partner</th><th>Status</th><th>Expires</th><th></th>
      </tr></thead>
      <tbody>
      ${rows
        .map((p) => {
          const exp = isExpired(p) ? " (overdue)" : "";
          return `<tr data-id="${esc(p.id)}">
            <td>${esc(p.title)}</td>
            <td>${esc(p.sector)}</td>
            <td>${p.opsVerified ? "✓ verified" : esc(p.partnerName || "—")}</td>
            <td>${esc(p.status)}${exp}</td>
            <td>${esc(String(p.expiresAt || "").slice(0, 10))}</td>
            <td class="gh-row-actions">
              <button type="button" class="admin-btn" data-edit="${esc(p.id)}">Edit</button>
              <button type="button" class="admin-btn" data-pub="${esc(p.id)}">Publish</button>
              <button type="button" class="admin-btn" data-exp="${esc(p.id)}">Expire</button>
              <button type="button" class="admin-btn" data-del="${esc(p.id)}">Delete</button>
            </td>
          </tr>`;
        })
        .join("")}
      </tbody></table></div>`;

    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    host.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.onclick = () => {
        const p = byId[btn.getAttribute("data-edit")];
        if (p) {
          fillForm(p);
          $("gh-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
    });
    host.querySelectorAll("[data-pub]").forEach((btn) => {
      btn.onclick = async () => {
        const user = await authReady.catch(() => null);
        await setPostStatus(btn.getAttribute("data-pub"), "published", user?.uid);
        await refreshList();
      };
    });
    host.querySelectorAll("[data-exp]").forEach((btn) => {
      btn.onclick = async () => {
        const user = await authReady.catch(() => null);
        await setPostStatus(btn.getAttribute("data-exp"), "expired", user?.uid);
        await refreshList();
      };
    });
    host.querySelectorAll("[data-del]").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Delete this program post?")) return;
        await removePost(btn.getAttribute("data-del"));
        if (editingId === btn.getAttribute("data-del")) clearForm();
        await refreshList();
      };
    });
  } catch (e) {
    host.innerHTML = `<p class="admin-panel-sub">Could not load posts: ${esc(e.message || e)}</p>`;
  }
}

$("gh-save")?.addEventListener("click", async () => {
  const status = $("gh-status-msg");
  const user = await authReady.catch(() => null);
  if (!user || !isOpsUid(user.uid)) {
    if (status) status.textContent = "Ops login required.";
    return;
  }
  try {
    if (status) status.textContent = "Saving…";
    const payload = formPayload();
    if (editingId) await updatePost(editingId, payload, user.uid);
    else await createPost(payload, user.uid);
    if (status) status.textContent = "Saved (free admin post).";
    clearForm();
    await refreshList();
  } catch (e) {
    if (status) status.textContent = "Error: " + (e.message || e);
  }
});

$("gh-clear")?.addEventListener("click", () => clearForm());

$("gh-expire-overdue")?.addEventListener("click", async () => {
  const status = $("gh-status-msg");
  const user = await authReady.catch(() => null);
  if (!user || !isOpsUid(user.uid)) return;
  try {
    const n = await expireOverduePosts(user.uid);
    if (status) status.textContent = `Expired ${n} overdue post(s).`;
    await refreshList();
  } catch (e) {
    if (status) status.textContent = "Expire failed: " + (e.message || e);
  }
});

document.querySelectorAll(".admin-tab-btn[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.getAttribute("data-tab") === "gov-housing") {
      setTimeout(refreshList, 40);
    }
  });
});

// sector options
(() => {
  const sel = $("gh-sector");
  if (sel && !sel.options.length) {
    SECTORS.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.label;
      sel.appendChild(o);
    });
  }
})();

clearForm();
authReady.then((u) => {
  if (u && isOpsUid(u.uid)) refreshList();
}).catch(() => {});
