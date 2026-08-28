/* Lightweight in-app dialogs (replace bare alert/confirm) */

// Every other file in this codebase (messages.js, contract-chat.js,
// admin/*.js) defines and uses an escapeHtml() before interpolating
// into innerHTML. This file didn't -- and it's not just a latent
// risk: js/profile/wanted-posts-summary.js's editWantedPost() passes
// a seeker's own freshly-typed title straight into showConfirm()'s
// message with no escaping upstream either, so this is a live,
// reachable XSS path, not a hypothetical one. Escaping message/title
// here matches the pattern the rest of the app already follows.
function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function ensureHost() {
    let host = document.getElementById("hf-dialog-host");
    if (host) return host;
    host = document.createElement("div");
    host.id = "hf-dialog-host";
    document.body.appendChild(host);
    return host;
}

export function showAlert(message, { title = "HomeFinder" } = {}) {
    return new Promise((resolve) => {
        const host = ensureHost();
        host.innerHTML = `
          <div class="hf-dialog-backdrop"></div>
          <div class="hf-dialog" role="alertdialog">
            <h3 class="hf-dialog-title">${escapeHtml(title)}</h3>
            <p class="hf-dialog-msg">${escapeHtml(message)}</p>
            <div class="hf-dialog-actions">
              <button type="button" class="hf-btn-ok primary-btn hf-dialog-ok">OK</button>
            </div>
          </div>`;
        host.classList.add("active");
        const close = () => {
            host.classList.remove("active");
            host.innerHTML = "";
            resolve();
        };
        host.querySelector(".hf-dialog-ok").onclick = close;
        host.querySelector(".hf-dialog-backdrop").onclick = close;
    });
}

export function showConfirm(message, { title = "Confirm", okText = "OK", cancelText = "Cancel" } = {}) {
    return new Promise((resolve) => {
        const host = ensureHost();
        let settled = false;
        const finish = (val) => {
            if (settled) return;
            settled = true;
            try {
                window.removeEventListener("popstate", onPop);
            } catch (_) {}
            host.classList.remove("active");
            host.innerHTML = "";
            resolve(val);
        };
        const onPop = () => {
            // Hardware/swipe back → Stay (cancel), not silent leave mid-confirm
            finish(false);
        };
        try {
            history.pushState({ hfDialog: 1 }, "");
            window.addEventListener("popstate", onPop);
        } catch (_) {}

        host.innerHTML = `
          <div class="hf-dialog-backdrop"></div>
          <div class="hf-dialog" role="alertdialog" aria-modal="true">
            <h3 class="hf-dialog-title">${escapeHtml(title)}</h3>
            <p class="hf-dialog-msg">${escapeHtml(message)}</p>
            <div class="hf-dialog-actions">
              <button type="button" class="hf-btn-cancel secondary-btn hf-dialog-cancel">${escapeHtml(cancelText)}</button>
              <button type="button" class="hf-btn-ok primary-btn hf-dialog-ok">${escapeHtml(okText)}</button>
            </div>
          </div>`;
        host.classList.add("active");
        host.querySelector(".hf-dialog-ok").onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            finish(true);
        };
        host.querySelector(".hf-dialog-cancel").onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            finish(false);
        };
        host.querySelector(".hf-dialog-backdrop").onclick = (e) => {
            e.preventDefault();
            finish(false);
        };
    });
}


export function showPrompt(message, { title = "Input", defaultValue = "", okText = "OK", cancelText = "Cancel", placeholder = "" } = {}) {
    return new Promise((resolve) => {
        const host = ensureHost();
        host.innerHTML = `
          <div class="hf-dialog-backdrop"></div>
          <div class="hf-dialog" role="dialog">
            <h3 class="hf-dialog-title">${escapeHtml(title)}</h3>
            <p class="hf-dialog-msg">${escapeHtml(message)}</p>
            <textarea class="hf-dialog-input" rows="3" placeholder="${escapeHtml(placeholder)}">${escapeHtml(defaultValue)}</textarea>
            <div class="hf-dialog-actions">
              <button type="button" class="hf-btn-cancel secondary-btn hf-dialog-cancel">${escapeHtml(cancelText)}</button>
              <button type="button" class="hf-btn-ok primary-btn hf-dialog-ok">${escapeHtml(okText)}</button>
            </div>
          </div>`;
        host.classList.add("active");
        const input = host.querySelector(".hf-dialog-input");
        input.focus();
        const finish = (val) => {
            host.classList.remove("active");
            host.innerHTML = "";
            resolve(val);
        };
        host.querySelector(".hf-dialog-ok").onclick = () => finish(input.value.trim());
        host.querySelector(".hf-dialog-cancel").onclick = () => finish(null);
        host.querySelector(".hf-dialog-backdrop").onclick = () => finish(null);
    });
}
