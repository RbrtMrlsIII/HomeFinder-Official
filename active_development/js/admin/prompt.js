// Ops dialogs — confirm + prompt (reason required paths use adminPrompt)
function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function ensureAdminDialogHost() {
    let host = document.getElementById("admin-dialog-host");
    if (host) return host;
    host = document.createElement("div");
    host.id = "admin-dialog-host";
    document.body.appendChild(host);
    if (!document.getElementById("admin-dialog-styles")) {
        const style = document.createElement("style");
        style.id = "admin-dialog-styles";
        style.textContent = `
#admin-dialog-host{display:none;position:fixed;inset:0;z-index:100000;align-items:center;justify-content:center;padding:16px}
#admin-dialog-host.active{display:flex}
.admin-dialog-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55)}
.admin-dialog{position:relative;z-index:1;width:min(440px,100%);background:#1e2430;color:#e8eef7;border-radius:14px;border:1px solid #3a4455;padding:18px 18px 14px;box-shadow:0 16px 48px rgba(0,0,0,.45)}
.admin-dialog h3{margin:0 0 8px;font-size:1.05rem}
.admin-dialog p{margin:0 0 12px;line-height:1.45;color:#cbd5e1;font-size:14px}
.admin-dialog textarea,.admin-dialog select,.admin-dialog input[type="text"]{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid #3a4455;background:#141820;color:#e8eef7;font:inherit;margin-bottom:12px}
.admin-dialog textarea{min-height:80px;resize:vertical}
.admin-dialog textarea:focus,.admin-dialog select:focus,.admin-dialog input:focus{outline:2px solid #C4A574;border-color:#C4A574}
.admin-dialog-actions{display:flex;gap:8px;justify-content:flex-end}
.admin-dialog-actions button{padding:8px 16px;border-radius:999px;border:none;cursor:pointer;font:inherit;font-weight:600}
.admin-dialog-cancel{background:#2a3140;color:#e8eef7}
.admin-dialog-ok{background:#C4A574;color:#1a1d21}
.admin-dialog-ok.danger{background:#b42318;color:#fff}
.admin-dialog-error{color:#f5a8a8;font-size:13px;margin:-6px 0 10px;display:none}
.admin-dialog-error.show{display:block}
.admin-dialog label.field-lab{display:block;font-size:13px;margin:0 0 4px;color:#cbd5e1}`;
        document.head.appendChild(style);
    }
    return host;
}

export function adminConfirm(message, { title = "Confirm", okText = "OK", cancelText = "Cancel", danger = false } = {}) {
    return new Promise((resolve) => {
        const host = ensureAdminDialogHost();
        host.innerHTML = `<div class="admin-dialog-backdrop"></div><div class="admin-dialog" role="alertdialog"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p><div class="admin-dialog-actions"><button type="button" class="admin-dialog-cancel">${escapeHtml(cancelText)}</button><button type="button" class="admin-dialog-ok ${danger ? "danger" : ""}">${escapeHtml(okText)}</button></div></div>`;
        host.classList.add("active");
        const finish = (v) => { host.classList.remove("active"); host.innerHTML = ""; resolve(v); };
        host.querySelector(".admin-dialog-ok").onclick = () => finish(true);
        host.querySelector(".admin-dialog-cancel").onclick = () => finish(false);
        host.querySelector(".admin-dialog-backdrop").onclick = () => finish(false);
    });
}

/** Text prompt. Returns trimmed string or null if cancelled. */
export function adminPrompt(message, {
    title = "Reason",
    defaultValue = "",
    placeholder = "Shown to the user…",
    okText = "Submit",
    cancelText = "Cancel",
    required = false,
    extraHtml = ""
} = {}) {
    return new Promise((resolve) => {
        const host = ensureAdminDialogHost();
        host.innerHTML = `<div class="admin-dialog-backdrop"></div><div class="admin-dialog" role="dialog">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
            ${extraHtml || ""}
            <textarea class="admin-prompt-input" rows="3" placeholder="${escapeHtml(placeholder)}">${escapeHtml(defaultValue)}</textarea>
            <p class="admin-dialog-error" id="admin-prompt-err">A reason is required.</p>
            <div class="admin-dialog-actions">
                <button type="button" class="admin-dialog-cancel">${escapeHtml(cancelText)}</button>
                <button type="button" class="admin-dialog-ok danger">${escapeHtml(okText)}</button>
            </div>
        </div>`;
        host.classList.add("active");
        const input = host.querySelector(".admin-prompt-input");
        const err = host.querySelector("#admin-prompt-err");
        setTimeout(() => { input.focus(); }, 30);
        const finish = (v) => { host.classList.remove("active"); host.innerHTML = ""; resolve(v); };
        host.querySelector(".admin-dialog-ok").onclick = () => {
            const val = input.value.trim();
            if (required && !val) {
                err.classList.add("show");
                input.focus();
                return;
            }
            finish(val);
        };
        host.querySelector(".admin-dialog-cancel").onclick = () => finish(null);
        host.querySelector(".admin-dialog-backdrop").onclick = () => finish(null);
    });
}

/**
 * KYC decline: reason + severity → resubmit window.
 * Returns { reason, resubmitHours, severityLabel } or null.
 */
export function adminKycDeclinePrompt() {
    return new Promise((resolve) => {
        const host = ensureAdminDialogHost();
        host.innerHTML = `<div class="admin-dialog-backdrop"></div><div class="admin-dialog" role="dialog">
            <h3>Decline KYC</h3>
            <p>Explain why this submission is declined. The user sees the reason and when they may submit again.</p>
            <label class="field-lab">Resubmit window (by severity)</label>
            <select class="admin-kyc-severity">
                <option value="0.02">Minor (blurred / crop) — ~1 minute</option>
                <option value="2" selected>Normal — 2 hours</option>
                <option value="24">Needs clearer docs — 24 hours</option>
                <option value="72">Serious issue — 3 days</option>
                <option value="720">Prohibited / non-KYC content — 30 days</option>
            </select>
            <textarea class="admin-prompt-input" rows="3" placeholder="e.g. Image blurred — please retake in good light…"></textarea>
            <p class="admin-dialog-error" id="admin-prompt-err">A reason is required.</p>
            <div class="admin-dialog-actions">
                <button type="button" class="admin-dialog-cancel">Cancel</button>
                <button type="button" class="admin-dialog-ok danger">Decline &amp; notify</button>
            </div>
        </div>`;
        host.classList.add("active");
        const input = host.querySelector(".admin-prompt-input");
        const sel = host.querySelector(".admin-kyc-severity");
        const err = host.querySelector("#admin-prompt-err");
        setTimeout(() => input.focus(), 30);
        const finish = (v) => { host.classList.remove("active"); host.innerHTML = ""; resolve(v); };
        host.querySelector(".admin-dialog-ok").onclick = () => {
            const reason = input.value.trim();
            if (!reason) { err.classList.add("show"); input.focus(); return; }
            const hours = parseFloat(sel.value) || 2;
            const severityLabel = sel.options[sel.selectedIndex]?.text || "";
            finish({ reason, resubmitHours: hours, severityLabel });
        };
        host.querySelector(".admin-dialog-cancel").onclick = () => finish(null);
        host.querySelector(".admin-dialog-backdrop").onclick = () => finish(null);
    });
}
