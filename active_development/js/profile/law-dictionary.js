import { lockBodyScroll, unlockBodyScroll } from "./body-scroll-lock.js";
/* ==================================== */
/*  DICTIONARY OF PHILIPPINE PROPERTY LAW */
/* ==================================== */
/* Educational reference only — not legal advice. */

export const PROPERTY_LAWS = [
    {
        id: "civil-code",
        title: "Civil Code of the Philippines (Republic Act No. 386)",
        topic: "Ownership, possession, lease, easements",
        summary: "Core rules on ownership, co-ownership, possession, usufruct, easements, and lease of things. Book II and related lease provisions govern many landlord–tenant and ownership disputes."
    },
    {
        id: "pd-1529",
        title: "Property Registration Decree (Presidential Decree No. 1529)",
        topic: "Land titles & registration",
        summary: "Governs the Torrens system in the Philippines: original registration, subsequent dealings, certificates of title, and the indefeasibility of a valid Torrens title."
    },
    {
        id: "pd-957",
        title: "Subdivision and Condominium Buyers’ Protective Decree (P.D. 957)",
        topic: "Subdivisions & condominiums",
        summary: "Protects buyers of subdivision lots and condominium units. Requires registration/license to sell, delivery of title, and remedies against developers who fail to develop or deliver."
    },
    {
        id: "ra-4726",
        title: "The Condominium Act (Republic Act No. 4726)",
        topic: "Condominium ownership",
        summary: "Defines condominium corporations, common areas, unit ownership, master deeds, and declaration of restrictions for multi-unit buildings."
    },
    {
        id: "ra-6552",
        title: "Maceda Law (Republic Act No. 6552)",
        topic: "Installment sales of real estate",
        summary: "Protects buyers of real property on installment. After paying at least two years of installments, the buyer gains rights to a grace period and refund of a portion of payments upon cancellation."
    },
    {
        id: "ra-9653",
        title: "Rent Control Act of 2009 (Republic Act No. 9653)",
        topic: "Residential rent limits",
        summary: "Limits rent increases for covered residential units below a threshold amount, sets rules on deposits and advance rent, and restricts certain eviction practices for covered units."
    },
    {
        id: "ra-9646",
        title: "Real Estate Service Act (RESA) — R.A. 9646",
        topic: "Brokers, appraisers, consultants",
        summary: "Regulates real estate service practitioners. Only PRC-licensed real estate brokers (and related practitioners) may practice; colorum practice is penalized."
    },
    {
        id: "ra-9904",
        title: "Magna Carta for Homeowners and Homeowners’ Associations (R.A. 9904)",
        topic: "HOAs & subdivisions",
        summary: "Rights and obligations of homeowners and associations, membership, dues, and governance of residential subdivisions and villages."
    },
    {
        id: "ra-7279",
        title: "Urban Development and Housing Act (UDHA) — R.A. 7279",
        topic: "Social housing & eviction",
        summary: "Framework for socialized housing, resettlement, and procedures affecting underprivileged and homeless citizens, including eviction and demolition safeguards."
    },
    {
        id: "ra-11201",
        title: "Department of Human Settlements and Urban Development Act (R.A. 11201)",
        topic: "DHSUD",
        summary: "Creates DHSUD as the primary national agency for housing, human settlements, and urban development, consolidating related regulatory functions."
    },
    {
        id: "bp-220",
        title: "Batas Pambansa Blg. 220",
        topic: "Economic & socialized housing standards",
        summary: "Standards for economic and socialized housing projects, including planning and design requirements distinct from open-market housing."
    },
    {
        id: "ra-10023",
        title: "Residential Free Patent Act (R.A. 10023)",
        topic: "Titling residential lands",
        summary: "Simplifies issuance of free patents for residential lands occupied under conditions set by law, supporting formalization of ownership."
    },
    {
        id: "ra-10752",
        title: "Right-of-Way Act (R.A. 10752)",
        topic: "Expropriation for national projects",
        summary: "Rules on acquisition of right-of-way, site, or location for national government infrastructure projects, including standards for just compensation."
    },
    {
        id: "ra-7652",
        title: "Investors’ Lease Act (R.A. 7652)",
        topic: "Long-term lease to foreign investors",
        summary: "Allows long-term leases of private lands to foreign investors under specified conditions (subject to constitutional limits on land ownership)."
    },
    {
        id: "const-xii",
        title: "1987 Constitution — Article XII (National Economy and Patrimony)",
        topic: "Land ownership limits",
        summary: "Foreigners generally cannot own land; ownership is reserved to Filipino citizens and qualified corporations. Lease and condominium unit rules interact with this framework."
    },
    {
        id: "ra-8763",
        title: "Home Guaranty Act (related housing finance framework)",
        topic: "Housing finance guarantees",
        summary: "Supports housing finance through guaranty mechanisms historically linked to expanding access to home ownership (check current implementing agencies for active programs)."
    },
    {
        id: "lease-basics",
        title: "Lease essentials (Civil Code)",
        topic: "Rentals & contracts",
        summary: "Lease is a contract where one party temporarily grants use of a thing for a price. Written contracts are strongly recommended. Deposits, duration, repairs, and return of the premises should be clearly agreed."
    },
    {
        id: "rent-to-own",
        title: "Rent-to-own / lease-purchase (contract practice)",
        topic: "Hybrid arrangements",
        summary: "Not a single special statute: terms depend on the written contract and may engage Maceda Law if structured as an installment sale of real property. Clear documentation is critical."
    }
];

export function openLawDictionary() {
    const modal = document.getElementById("law-dictionary-modal");
    if (modal) {
        modal.classList.add("active");
        lockBodyScroll();
    }
}

export function closeLawDictionary() {
    const modal = document.getElementById("law-dictionary-modal");
    if (modal) {
        modal.classList.remove("active");
        unlockBodyScroll();
    }
}

function renderLawList(filter = "") {
    const list = document.getElementById("law-dictionary-list");
    if (!list) return;
    const q = filter.trim().toLowerCase();
    const rows = PROPERTY_LAWS.filter(law => {
        if (!q) return true;
        return `${law.title} ${law.topic} ${law.summary}`.toLowerCase().includes(q);
    });
    list.innerHTML = rows.map(law => `
        <article class="law-card">
            <h4>${law.title}</h4>
            <span class="law-topic">${law.topic}</span>
            <p>${law.summary}</p>
        </article>
    `).join("") || `<p class="law-empty">No entries match your search.</p>`;
}

const modal = document.getElementById("law-dictionary-modal");
if (modal) {
    renderLawList();
    document.getElementById("law-dictionary-close")?.addEventListener("click", closeLawDictionary);
    document.getElementById("law-dictionary-backdrop")?.addEventListener("click", closeLawDictionary);
    document.getElementById("law-dictionary-search")?.addEventListener("input", (e) => {
        renderLawList(e.target.value);
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeLawDictionary();
    });
}