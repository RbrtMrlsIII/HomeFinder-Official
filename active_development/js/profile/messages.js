/* HF-BUILD-2026-08-16-M70 | Messages 2.0 — P2P hub (SoT Phase 7)
 * Unread · search · archive · mute · timestamps · read marks
 * No property-linked threads in UI (Contracts owns deals).
 */
import { user, db, functions } from "./core.js";
import { activateTab } from "./tabs.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listEl = document.getElementById("conversation-list");
const windowEl =
  document.getElementById("chat-window") ||
  document.querySelector("#panel-messages .chat-window");
const searchEl = document.getElementById("messages-search");

let activeConvoId = null;
let unsubMessages = null;
let cacheRows = [];
let filterMode = "all"; // all | unread | archived
let searchQ = "";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* Header collapse is owned by header-scroll.js only.
 * Do NOT force .collapsed here — it snapped the clay band on Messages tab
 * and fought expandHeader() on tab click. */
/** Deterministic P2P id (no property segment in new opens) */
export function conversationIdFor(uidA, uidB, propertyId = "") {
  const pair = [uidA, uidB].sort().join("_");
  // Phase 7: prefer pure P2P ids; property segment only if legacy callers pass it
  return propertyId ? `${pair}__${propertyId}` : pair;
}

function isArchived(c) {
  return !!(c.archivedBy && c.archivedBy[user?.uid]);
}
function isMuted(c) {
  return !!(c.mutedBy && c.mutedBy[user?.uid]);
}
function isHidden(c) {
  return !!(c.hiddenBy && c.hiddenBy[user?.uid]);
}
function unreadFor(c) {
  const n = c.unreadCounts?.[user?.uid];
  return Number(n) || 0;
}

function timeLabel(iso) {
  if (!iso) return "";
  try {
    const d = typeof iso?.toDate === "function" ? iso.toDate() : new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (_) {
    return "";
  }
}

/**
 * Open or create a pure P2P conversation, then jump to Messages.
 * property* fields accepted for legacy callers but not shown as thread product cards.
 */
export async function openConversationWith(opts) {
  if (!user?.uid) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }
  const otherUid = opts.otherUid;
  if (!otherUid || otherUid === user.uid) {
    alert("You can't message yourself.");
    return;
  }
  // Phase 7: force pure P2P id (ignore property for new threads)
  const cid = conversationIdFor(user.uid, otherUid, "");
  const ref = doc(db, "conversations", cid);
  const payload = {
    participantIds: [user.uid, otherUid].sort(),
    updatedAt: new Date().toISOString(),
    kind: "p2p"
  };
  let snap = null;
  try {
    snap = await getDoc(ref);
  } catch (readErr) {
    console.warn("conversation getDoc:", readErr);
    snap = null;
  }
  if (!snap || !snap.exists()) {
    try {
      await setDoc(ref, {
        ...payload,
        createdAt: new Date().toISOString(),
        lastMessage: "",
        lastMessageAt: new Date().toISOString(),
        unreadCounts: { [otherUid]: 0, [user.uid]: 0 },
        archivedBy: {},
        mutedBy: {},
        hiddenBy: {}
      });
    } catch (err) {
      const code = err.code || "";
      if (code === "permission-denied" || /permission|insufficient/i.test(String(err.message || ""))) {
        throw new Error(
          "Missing permissions to start chat. Deploy latest firestore.rules on the homefinder database."
        );
      }
      throw err;
    }
  } else {
    try {
      await updateDoc(ref, { updatedAt: payload.updatedAt, kind: "p2p" });
    } catch (_) {}
  }

  sessionStorage.setItem("hf_open_convo", cid);

  // Issue 1: visitor mode (profile.html?uid=…) hides Messages tab/panel.
  // Always open chat on the viewer's own profile, not the visited shell.
  const path = location.pathname || "";
  const onProfile = /profile\.html$/i.test(path) || path.endsWith("/profile");
  const visitingOther = new URLSearchParams(location.search).get("uid");

  if (onProfile && visitingOther && visitingOther !== user.uid) {
    location.href = "profile.html#messages";
    return;
  }

  if (onProfile) {
    try {
      document.body.classList.remove("visitor-mode");
    } catch (_) {}
    activateTab("messages");
    try {
      await loadConversationList();
    } catch (_) {}
    await openThread(cid);
    try {
      document.getElementById("chat-input")?.focus();
    } catch (_) {}
    return;
  }

  location.href = "profile.html#messages";
}

async function enrichRow(c) {
  const otherUid = (c.participantIds || []).find((id) => id !== user.uid) || "";
  let other = {
    uid: otherUid,
    name: c.nickname || "Contact",
    avatarUrl: "",
    role: "",
    verified: false,
    online: false,
    lastActive: null,
    hideOnline: false
  };
  if (otherUid) {
    try {
      const getPeerProfile = httpsCallable(functions, "getConversationPeerProfile");
      const peer = await getPeerProfile({ peerUid: otherUid, conversationId: c.id || c.conversationId || "" });
      const d = peer.data || {};
      other.name =
        c.nickname ||
        `${d.firstName || ""} ${d.surname || ""}`.trim() ||
        "Contact";
      other.avatarUrl = d.avatarUrl || "";
      other.role = d.accountType || "";
      other.verified = d.verifiedBadge === true;
      other.hideOnline = d.hideOnline === true;
      other.lastActive = d.lastActiveAt || null;
      if (!other.hideOnline && other.lastActive) {
        const t =
          typeof other.lastActive?.toDate === "function"
            ? other.lastActive.toDate().getTime()
            : new Date(other.lastActive).getTime();
        other.online = Date.now() - t < 5 * 60 * 1000;
      }
    } catch (_) {}
  }
  return { ...c, other };
}

function matchesFilter(c) {
  // Issue 3: Hidden is its own bucket (hiddenBy); All/Unread exclude hidden
  if (filterMode === "hidden") return isHidden(c);
  if (isHidden(c)) return false;
  if (filterMode === "unread") return unreadFor(c) > 0 && !isArchived(c);
  if (filterMode === "archived") return isArchived(c);
  return !isArchived(c); // all = non-archived, non-hidden
}

function matchesSearch(c) {
  if (!searchQ) return true;
  const q = searchQ.toLowerCase();
  const name = (c.other?.name || "").toLowerCase();
  const last = (c.lastMessage || "").toLowerCase();
  return name.includes(q) || last.includes(q);
}

function renderList() {
  if (!listEl) return;
  const notice = `<div class="chat-safety-notice" role="note">
    <i class="bx bx-shield-quarter"></i>
    <span>Be polite. Never share OTPs, IDs, or bank details in chat.</span>
  </div>
  <p class="msg-actions-guide field-hint" role="note">
    <strong>Thread tools:</strong> <em>Mute</em> stops notifications · <em>Archive</em> files the chat (Archived filter) · <em>Hide</em> removes it from All (restore under Hidden).
  </p>`;

  let rows = cacheRows.filter(matchesFilter).filter(matchesSearch);

  if (!rows.length) {
    listEl.innerHTML =
      notice +
      `<div class="panel-empty u-pad-30-16">
        <i class="bx bx-chat u-text-32"></i>
        <p class="u-text-13">${
          filterMode === "archived"
            ? "No archived conversations."
            : filterMode === "unread"
              ? "You’re all caught up."
              : "No conversations yet. Message someone from user search."
        }</p>
      </div>`;
    return;
  }

  listEl.innerHTML =
    notice +
    rows
      .map((c) => {
        const unread = unreadFor(c);
        const muted = isMuted(c);
        const active = c.id === activeConvoId ? " is-active" : "";
        const initial = (c.other?.name || "?").slice(0, 1).toUpperCase();
        const avatar = c.other?.avatarUrl
          ? `<img src="${esc(c.other.avatarUrl)}" alt="" class="convo-avatar-img">`
          : `<span class="convo-avatar-fallback">${esc(initial)}</span>`;
        const presence =
          c.other?.hideOnline
            ? ""
            : c.other?.online
              ? `<span class="convo-presence is-online" title="Online"></span>`
              : "";
        return `<button type="button" class="convo-row${active}" data-cid="${esc(c.id)}">
          <div class="convo-avatar">${avatar}${presence}</div>
          <div class="convo-body">
            <div class="convo-top">
              <strong class="convo-name">${esc(c.other?.name || "Contact")}${muted ? " <i class='bx bx-bell-off' title='Muted'></i>" : ""}</strong>
              <time class="convo-time">${esc(timeLabel(c.lastMessageAt || c.updatedAt))}</time>
            </div>
            <div class="convo-bottom">
              <span class="convo-preview">${esc((c.lastMessage || "No messages yet").slice(0, 80))}</span>
              ${unread > 0 ? `<span class="convo-unread">${unread > 99 ? "99+" : unread}</span>` : ""}
            </div>
          </div>
        </button>`;
      })
      .join("");

  listEl.querySelectorAll(".convo-row").forEach((btn) => {
    btn.onclick = () => openThread(btn.getAttribute("data-cid"));
  });
}

async function loadConversationList() {
  if (!listEl || !user?.uid) return;
    listEl.innerHTML = `<p class="field-hint u-pad-12">Loading…</p>`;
  try {
    const qy = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", user.uid)
    );
    const snap = await getDocs(qy);
    // Keep hidden rows in cache so the Hidden filter can restore them
    const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    raw.sort((a, b) =>
      String(b.lastMessageAt || b.updatedAt || "").localeCompare(
        String(a.lastMessageAt || a.updatedAt || "")
      )
    );
    cacheRows = await Promise.all(raw.map(enrichRow));
    renderList();
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `<p class="field-hint u-pad-12">Could not load conversations. Check rules / network.</p>`;
  }

  // Soft presence for self
  try {
    await updateDoc(doc(db, "users", user.uid), {
      lastActiveAt: new Date().toISOString()
    });
  } catch (_) {}
}

async function patchConvo(cid, patch) {
  await updateDoc(doc(db, "conversations", cid), {
    ...patch,
    updatedAt: new Date().toISOString()
  });
  const i = cacheRows.findIndex((r) => r.id === cid);
  if (i >= 0) cacheRows[i] = { ...cacheRows[i], ...patch };
  renderList();
}

async function openThread(cid) {
  if (!windowEl || !user?.uid || !cid) return;
  activeConvoId = cid;
    if (unsubMessages) {
    try {
      unsubMessages();
    } catch (_) {}
    unsubMessages = null;
  }

  renderList();

  let meta = cacheRows.find((r) => r.id === cid);
  if (!meta) {
    try {
      const snap = await getDoc(doc(db, "conversations", cid));
      if (snap.exists()) meta = await enrichRow({ id: cid, ...snap.data() });
    } catch (_) {}
  }
  const name = meta?.other?.name || "Conversation";
  const muted = meta ? isMuted(meta) : false;
  const archived = meta ? isArchived(meta) : false;

  windowEl.innerHTML = `
    <header class="chat-thread-head">
      <div class="chat-thread-title">
        <strong>${esc(name)}</strong>
        <span class="field-hint">P2P · not a listing deal</span>
      </div>
      <div class="chat-thread-actions" role="toolbar" aria-label="Conversation tools">
        <button type="button" class="chat-act-btn" data-act="mute" title="${muted ? "Unmute notifications" : "Mute notifications"}" aria-label="${muted ? "Unmute" : "Mute"}">
          <i class="bx ${muted ? "bx-bell-off" : "bx-bell"}" aria-hidden="true"></i>
          <span class="chat-act-label">${muted ? "Unmute" : "Mute"}</span>
        </button>
        <button type="button" class="chat-act-btn" data-act="archive" title="${archived ? "Move back to All" : "Archive this chat"}" aria-label="${archived ? "Unarchive" : "Archive"}">
          <i class="bx bx-archive" aria-hidden="true"></i>
          <span class="chat-act-label">${archived ? "Unarchive" : "Archive"}</span>
        </button>
        <button type="button" class="chat-act-btn" data-act="hide" title="${isHidden(meta || {}) ? "Show in All again" : "Hide from All — restore under Hidden"}" aria-label="${isHidden(meta || {}) ? "Unhide" : "Hide"}">
          <i class="bx ${isHidden(meta || {}) ? "bx-show" : "bx-hide"}" aria-hidden="true"></i>
          <span class="chat-act-label">${isHidden(meta || {}) ? "Unhide" : "Hide"}</span>
        </button>
      </div>
    </header>
    <div class="chat-messages" id="chat-messages"></div>
    <form class="chat-compose" id="chat-compose">
      <input type="text" id="chat-input" maxlength="2000" placeholder="Write a message…" autocomplete="off" required>
      <button type="submit" class="primary-btn" id="chat-send">Send</button>
    </form>`;

  // Clear unread for me
  try {
    await patchConvo(cid, { [`unreadCounts.${user.uid}`]: 0 });
  } catch (_) {
    try {
      const uc = { ...(meta?.unreadCounts || {}), [user.uid]: 0 };
      await patchConvo(cid, { unreadCounts: uc });
    } catch (__) {}
  }

  const msgBox = document.getElementById("chat-messages");
  const qy = query(
    collection(db, "conversations", cid, "messages"),
    orderBy("createdAt", "asc"),
    limit(120)
  );

  unsubMessages = onSnapshot(
    qy,
    (snap) => {
      if (!msgBox) return;
      if (snap.empty) {
        msgBox.innerHTML = `<p class="field-hint u-pad-12">Say hello — this is a private P2P thread.</p>`;
        return;
      }
      msgBox.innerHTML = snap.docs
        .map((d) => {
          const m = d.data();
          const mine = m.senderId === user.uid;
          const ts = timeLabel(m.createdAt);
          const read =
            mine && m.readBy && Object.keys(m.readBy).some((k) => k !== user.uid)
              ? `<span class="msg-read" title="Seen">✓✓</span>`
              : mine
                ? `<span class="msg-sent" title="Sent">✓</span>`
                : "";
          return `<div class="chat-bubble ${mine ? "is-mine" : "is-theirs"}">
            <p>${esc(m.text || "")}</p>
            <footer><time>${esc(ts)}</time>${read}</footer>
          </div>`;
        })
        .join("");
      msgBox.scrollTop = msgBox.scrollHeight;

      // Mark incoming as read
      snap.docs.forEach(async (d) => {
        const m = d.data();
        if (m.senderId !== user.uid && !(m.readBy && m.readBy[user.uid])) {
          try {
            await updateDoc(d.ref, {
              [`readBy.${user.uid}`]: new Date().toISOString()
            });
          } catch (_) {}
        }
      });
    },
    (err) => {
      console.warn(err);
      if (msgBox) msgBox.innerHTML = `<p class="field-hint">Could not load messages.</p>`;
    }
  );

  windowEl.querySelector("[data-act=mute]")?.addEventListener("click", async () => {
    const next = !isMuted(meta || {});
    try {
      await patchConvo(cid, { [`mutedBy.${user.uid}`]: next });
      openThread(cid);
    } catch (e) {
      alert(e.message || e);
    }
  });
  windowEl.querySelector("[data-act=archive]")?.addEventListener("click", async () => {
    const next = !isArchived(meta || {});
    try {
      await patchConvo(cid, { [`archivedBy.${user.uid}`]: next });
      activeConvoId = null;
      windowEl.innerHTML = `<div class="panel-empty u-pad-30-16"><p>Conversation ${next ? "archived" : "restored"}.</p></div>`;
      await loadConversationList();
    } catch (e) {
      alert(e.message || e);
    }
  });
  windowEl.querySelector("[data-act=hide]")?.addEventListener("click", async () => {
    const currentlyHidden = isHidden(meta || {});
    if (currentlyHidden) {
      try {
        await patchConvo(cid, { [`hiddenBy.${user.uid}`]: false });
        filterMode = "all";
        document.querySelectorAll(".msg-filter").forEach((b) => {
          const on = b.getAttribute("data-filter") === "all";
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        await loadConversationList();
        openThread(cid);
      } catch (e) {
        alert(e.message || e);
      }
      return;
    }
    if (!confirm("Hide this conversation from All / Unread?\n\nYou can restore it anytime under the Hidden filter.")) return;
    try {
      await patchConvo(cid, { [`hiddenBy.${user.uid}`]: true });
      activeConvoId = null;
      windowEl.innerHTML = `<div class="panel-empty u-pad-30-16"><p>Conversation hidden. Open the <strong>Hidden</strong> filter to unhide.</p></div>`;
      await loadConversationList();
    } catch (e) {
      alert(e.message || e);
    }
  });

  document.getElementById("chat-compose")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const text = String(input?.value || "").trim();
    if (!text) return;
    const sendBtn = document.getElementById("chat-send");
    if (sendBtn) sendBtn.disabled = true;
    let messageOk = false;
    try {
      await addDoc(collection(db, "conversations", cid, "messages"), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp(),
        readBy: { [user.uid]: new Date().toISOString() }
      });
      messageOk = true;
      if (input) input.value = "";

      const otherUid = (meta?.participantIds || []).find((id) => id !== user.uid);
      const unreadPatch = otherUid
        ? { unreadCounts: { ...(meta?.unreadCounts || {}), [otherUid]: (Number(meta?.unreadCounts?.[otherUid]) || 0) + 1, [user.uid]: 0 } }
        : {};
      try {
        await updateDoc(doc(db, "conversations", cid), {
          lastMessage: text.slice(0, 200),
          lastMessageAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...unreadPatch
        });
      } catch (metaErr) {
        console.warn("conversation meta after send", metaErr);
        // Message already stored — do not scare user with full Send failed
      }
      await loadConversationList();
    } catch (err) {
      if (!messageOk) {
        alert("Send failed: " + (err.message || err));
      } else {
        console.warn("post-send", err);
        try { await loadConversationList(); } catch (_) {}
      }
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  });
}

/* Filters + search */
document.querySelectorAll(".msg-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    filterMode = btn.getAttribute("data-filter") || "all";
    document.querySelectorAll(".msg-filter").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    renderList();
  });
});
searchEl?.addEventListener("input", () => {
  searchQ = String(searchEl.value || "").trim();
  renderList();
});

async function bootMessages() {
  if (!user) return;
  const visitQ = new URLSearchParams(location.search).get("uid");
  const pendingUid = sessionStorage.getItem("hf_pending_msg_uid");
  const pendingEarly = sessionStorage.getItem("hf_open_convo");

  // Still on a visit URL with a pending open → force own profile first
  if ((pendingUid || pendingEarly) && visitQ && visitQ !== user.uid) {
    location.replace("profile.html#messages");
    return;
  }

  await loadConversationList();

  // Visitor Message CTA: create/open P2P with stored uid (no import on visit page)
  if (pendingUid) {
    sessionStorage.removeItem("hf_pending_msg_uid");
    sessionStorage.removeItem("hf_open_messages");
    try {
      activateTab("messages");
      await openConversationWith({ otherUid: pendingUid });
      return;
    } catch (e) {
      console.error(e);
      alert("Could not open chat: " + (e.message || e));
    }
  }

  const pending = sessionStorage.getItem("hf_open_convo");
  if (pending) {
    sessionStorage.removeItem("hf_open_convo");
    activateTab("messages");
    await openThread(pending);
    try {
      document.getElementById("chat-input")?.focus();
    } catch (_) {}
  } else if (location.hash === "#messages") {
    activateTab("messages");
  }
}

document.addEventListener("hf:tab-activated", (e) => {
  if (e.detail?.tab === "messages") loadConversationList();
});

// Delayed boot so core user is ready
setTimeout(() => { bootMessages().catch((e) => console.warn("bootMessages", e)); }, 300);
window.hfOpenConversation = openConversationWith;


/* Issue 5 — Messages guide modal */
function wireMessagesGuide() {
  const btn = document.getElementById("messages-guide-btn");
  const modal = document.getElementById("messages-guide-modal");
  if (!btn || !modal) return;
  const open = () => {
    modal.hidden = false;
    document.body.classList.add("messages-guide-open");
  };
  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("messages-guide-open");
  };
  btn.addEventListener("click", open);
  modal.querySelectorAll("[data-close-guide]").forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}
wireMessagesGuide();
