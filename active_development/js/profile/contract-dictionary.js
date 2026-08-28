/* Contract dictionary — in-app reference for HomeFinder locking flow */

const ENTRIES = [
    {
        t: "Contract locking",
        d: "A mutual lock between two parties on a listing or wanted post. It does not process payments. It reserves the intent to proceed (first come, first served)."
    },
    {
        t: "Propose / Lock contract",
        d: "From a marketplace-linked chat, either party can propose a lock. The other party accepts (locks too) or rejects. Both locks are required before relocation details are collected."
    },
    {
        t: "Messaging-only contact",
        d: "Contacting someone via user search (no listing) opens a direct message thread only — no contract tools."
    },
    {
        t: "Relocation date & duration",
        d: "After both parties lock, each can set a preferred move-in/relocation date and contract duration. A calendar picker is used. The countdown appears on portfolio until that date."
    },
    {
        t: "Payments",
        d: "HomeFinder does not force online payment. Deposits and rent can be arranged in person. Never send money to unknown accounts from chat alone."
    },
    {
        t: "Scam awareness",
        d: "Staff never ask for OTPs or full ID photos in chat. Verify Verified/Licensed badges. Meet in safe public places when exchanging keys or cash."
    },
    {
        t: "Listing expiration (30 days)",
        d: "Property and wanted posts expire 30 days after publish. You get a reminder 3 days before. If you do not renew or delete within those 3 days, the listing may be auto-removed."
    },
    {
        t: "Edit lock after publish",
        d: "For 2 days after publishing a property listing, edit/delete may be restricted so seekers can trust what they saw."
    }
];

export function openContractDictionary() {
    let modal = document.getElementById("contract-dictionary-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "contract-dictionary-modal";
        modal.className = "law-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.innerHTML = `
          <div class="law-modal-backdrop" data-close="1"></div>
          <div class="law-modal-panel">
            <div class="law-modal-head">
              <h2><i class='bx bx-file'></i> Contract dictionary</h2>
              <button type="button" class="law-modal-close" data-close="1" aria-label="Close">&times;</button>
            </div>
            <p class="field-hint" style="padding:0 16px 8px;">How locking, chat, and listing windows work on HomeFinder. Not legal advice.</p>
            <div class="law-dictionary-list" id="contract-dictionary-list"></div>
          </div>`;
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => {
            if (e.target.dataset.close) modal.classList.remove("is-open");
        });
    }
    const list = modal.querySelector("#contract-dictionary-list");
    list.innerHTML = ENTRIES.map(e => `
      <article class="law-entry">
        <h3>${e.t}</h3>
        <p>${e.d}</p>
      </article>`).join("");
    modal.classList.add("is-open");
}
