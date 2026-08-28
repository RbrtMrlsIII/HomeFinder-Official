import { canonicalRoleFromData } from "../canonical-role.js";
/* User search — live filter, role chips, environment-aware, tap outside to close */
import { user, db } from "./core.js";
import { collection, getDocs, limit, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { lockBodyScroll, unlockBodyScroll } from "./body-scroll-lock.js";

let cache = null;
let modal = null;
let roleFilter = "all";

async function loadUsers() {
  if (cache) return cache;
  const snap = await getDocs(query(collection(db, "publicProfiles"), limit(400)));
  cache = snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      uid: d.id,
      searchable: data.searchable !== false,
      firstName: data.firstName || "",
      surname: data.surname || data.lastName || "",
      email: data.publicEmail || "",
      accountType: canonicalRoleFromData(data) || "",
      avatarUrl: data.avatarUrl || "",
      tier: data.tierIndex ?? 0,
      verified: data.verifiedBadge === true,
      licensed: data.licensedBadge === true,
    };
  }).filter((u) => u.searchable);
  cache.sort((a, b) => {
    const s = (u) => (u.verified ? 4 : 0) + (u.licensed ? 3 : 0) + (Number(u.tier) || 0);
    return s(b) - s(a);
  });
  return cache;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function openProfile(uid) {
  if (!uid) return;
  window.location.assign(`profile.html?uid=${encodeURIComponent(uid)}`);
}

function renderSuggest(q, list, countEl) {
  const term = (q || "").trim().toLowerCase();
  let users = (cache || []).filter((u) => u.uid !== user?.uid);
  if (roleFilter && roleFilter !== "all") {
    users = users.filter((u) => u.accountType === roleFilter);
  }
  const hits = term
    ? users
        .filter((u) => {
          const hay = `${u.firstName} ${u.surname} ${u.email} ${u.accountType}`.toLowerCase();
          return term.split(/\s+/).every((t) => hay.includes(t));
        })
        .slice(0, 24)
    : users.slice(0, 16);

  if (countEl) {
    countEl.textContent = hits.length
      ? `${hits.length} people${term ? " matching" : " suggested"}`
      : "No matches";
  }

  if (!hits.length) {
    list.innerHTML = `<li class="us-empty">No people found. Try another name or role filter.</li>`;
    return;
  }

  list.innerHTML = hits
    .map((u) => {
      const name = `${u.firstName} ${u.surname}`.trim() || "User";
      const initial = (u.firstName || u.surname || "?").charAt(0).toUpperCase();
      const av = u.avatarUrl
        ? `<img class="us-av" src="${escapeHtml(u.avatarUrl)}" alt="" loading="lazy" />`
        : `<div class="us-av us-av-ph">${escapeHtml(initial)}</div>`;
      const badges = [
        u.verified ? `<span class="us-b us-v">Verified</span>` : "",
        u.licensed ? `<span class="us-b us-l">Licensed</span>` : "",
        `<span class="us-b">T${u.tier}</span>`,
        u.accountType ? `<span class="us-b">${escapeHtml(u.accountType)}</span>` : "",
      ].join("");
      return `<li role="option" data-uid="${escapeHtml(u.uid)}" tabindex="0">
        ${av}
        <div class="us-meta">
          <div class="us-name">${escapeHtml(name)}</div>
          <div class="us-sub">${escapeHtml(u.email || u.accountType || "HomeFinder member")}</div>
          <div class="us-badges">${badges}</div>
        </div>
        <i class="bx bx-chevron-right" style="opacity:.45;font-size:22px;flex-shrink:0;"></i>
      </li>`;
    })
    .join("");
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  unlockBodyScroll();
}

function ensureModal() {
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "user-search-modal";
  modal.className = "hf-search-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="hf-search-card" role="dialog" aria-modal="true" aria-label="Search people">
      <div class="hf-search-head">
        <i class="bx bx-group"></i>
        <h3>Search people</h3>
        <button type="button" class="hf-search-close" id="user-search-close" aria-label="Close">&times;</button>
      </div>
      <div class="hf-search-filters" role="group" aria-label="Filter by role">
        <button type="button" class="hf-search-chip is-on" data-role="all">All</button>
        <button type="button" class="hf-search-chip" data-role="seeker">Seekers</button>
        <button type="button" class="hf-search-chip" data-role="owner">Owners</button>
        <button type="button" class="hf-search-chip" data-role="broker">Brokers</button>
      </div>
      <div class="hf-search-input-wrap">
        <input type="search" id="user-search-input" placeholder="Name, email, or role…" autocomplete="off" enterkeyhint="search" />
      </div>
      <p class="hf-search-hint">Live results · Tap a person to open profile · Tap outside or × to close</p>
      <p class="hf-search-count" id="user-search-count"></p>
      <ul id="user-search-suggest" role="listbox"></ul>
    </div>`;
  document.body.appendChild(modal);

  const input = modal.querySelector("#user-search-input");
  const list = modal.querySelector("#user-search-suggest");
  const countEl = modal.querySelector("#user-search-count");
  const card = modal.querySelector(".hf-search-card");

  modal.querySelector("#user-search-close")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  card?.addEventListener("click", (e) => e.stopPropagation());

  modal.querySelectorAll(".hf-search-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      roleFilter = chip.getAttribute("data-role") || "all";
      modal.querySelectorAll(".hf-search-chip").forEach((c) => c.classList.toggle("is-on", c === chip));
      renderSuggest(input.value, list, countEl);
    });
  });

  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => renderSuggest(input.value, list, countEl), 60);
  });
  list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-uid]");
    if (li) openProfile(li.getAttribute("data-uid"));
  });
  list.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const li = e.target.closest("li[data-uid]");
    if (li) openProfile(li.getAttribute("data-uid"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });

  return modal;
}

export async function openUserSearch() {
  if (!user) return;
  const m = ensureModal();
  m.hidden = false;
  lockBodyScroll();
  const input = m.querySelector("#user-search-input");
  const list = m.querySelector("#user-search-suggest");
  const countEl = m.querySelector("#user-search-count");
  list.innerHTML = `<li class="us-empty">Loading directory…</li>`;
  try {
    await loadUsers();
    renderSuggest(input.value, list, countEl);
  } catch (err) {
    list.innerHTML = `<li class="us-empty">Could not load users</li>`;
    console.warn(err);
  }
  input.focus();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-action="search-user"]');
  if (!btn) return;
  e.preventDefault();
  openUserSearch();
});