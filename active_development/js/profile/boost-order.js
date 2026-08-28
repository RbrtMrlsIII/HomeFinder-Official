/* ==================================== */
/*  BOOST ORDER — PayPal Hosted Buttons */
/* ==================================== */
/*
 * Flow (v1, no Blaze webhook yet):
 *  1. User opens package → boostOrders doc status "pending_payment"
 *  2. PayPal Hosted Button renders (money collected by PayPal)
 *  3. Boost is NOT auto-written from the client (insecure)
 *
 * BLAZE UPGRADE:
 *  - Enable Cloud Functions + PayPal webhook
 *  - functions/index.js → paypalWebhook verifies event → sets
 *    boosts/{uid} + order status "active" for BOOST_DURATION_DAYS
 *  - Then remove any temporary manual paths
 */

import { user, db } from "./core.js";
import { getRole } from "./role.js";
import {
    collection, addDoc, serverTimestamp, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    seekerBoostPackage, ownerBoostPackage,
    SEEKER_BOOST_PACKAGES, OWNER_BOOST_PACKAGES
} from "../tiers.js";
import {
    loadPayPalSdk, paypalButtonFor, formatPhp, BOOST_DURATION_DAYS
} from "../payment-config.js";
import { showAlert } from "./ui-dialog.js";

let selectedProduct = null;
let lastOrderId = null;

function ensureOrderModal() {
    let modal = document.getElementById("boost-order-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "boost-order-modal";
    modal.className = "law-modal profile-boost-checkout-modal";
    modal.setAttribute("data-asset", "profile-boost-checkout-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="law-modal-backdrop" id="boost-order-backdrop"></div>
      <div class="law-modal-panel boost-paypal-panel">
        <div class="boost-checkout-header">
          <div class="boost-checkout-heading">
            <h2 class="law-modal-title" id="boost-order-title">Checkout</h2>
            <p class="boost-checkout-sub" id="boost-order-sub"></p>
          </div>
          <button type="button" class="law-modal-close" id="boost-order-close" aria-label="Close">&times;</button>
        </div>
        <div class="boost-pending-callout" id="boost-order-note">
          <p class="boost-checkout-tip"><strong>Payment ≠ instant unlock.</strong> Boosts add <strong>capacity only</strong> (not Market access). After PayPal, the order stays <strong>pending</strong> until verified (webhook when live, or staff for now).</p>
          <ul class="boost-pending-steps">
            <li>Pay with the PayPal button below</li>
            <li>Order stays <strong>pending</strong> — perks stay off</li>
            <li>When verified, boost runs <strong>${BOOST_DURATION_DAYS} days</strong> from approval</li>
          </ul>
        </div>
        <div class="paypal-pay-surface" id="paypal-pay-surface">
          <div id="paypal-hosted-mount" class="paypal-hosted-mount" aria-live="polite"></div>
        </div>
        <p class="boost-checkout-status is-hidden" id="boost-order-status"></p>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#boost-order-backdrop")?.addEventListener("click", closeBoostOrder);
    modal.querySelector("#boost-order-close")?.addEventListener("click", closeBoostOrder);
    return modal;
}

function closeBoostOrder() {
    const modal = document.getElementById("boost-order-modal");
    if (modal) modal.classList.remove("is-open", "active");
    const mount = document.getElementById("paypal-hosted-mount");
    if (mount) mount.innerHTML = "";
    selectedProduct = null;
}

/**
 * @param {{ kind: 'seeker'|'owner', packageId: number, name: string, pricePhp: number, replacesPackage?: number|null }} product
 */
export async function openBoostOrder(product) {
    selectedProduct = product;
    const modal = ensureOrderModal();
    const title = modal.querySelector("#boost-order-title");
    const sub = modal.querySelector("#boost-order-sub");
    const status = modal.querySelector("#boost-order-status");
    const mount = modal.querySelector("#paypal-hosted-mount");
    if (status) {
        status.textContent = "";
        status.classList.add("is-hidden");
        status.classList.remove("status-ok", "status-err");
    }
    if (title) title.textContent = product.name;
    if (sub) {
        const rep = product.replacesPackage
            ? ` Replaces package ${product.replacesPackage} when activated (not refundable).`
            : "";
        sub.textContent = `${formatPhp(product.pricePhp)} · ${product.kind === "seeker" ? "Seeker" : "Owner"} boost · ${BOOST_DURATION_DAYS} days.${rep}`;
    }
    if (mount) mount.innerHTML = `<p class="paypal-mount-msg">Loading PayPal checkout…</p>`;
    modal.classList.add("is-open", "active");
    // Allow layout paint before PayPal measures the container
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const pp = paypalButtonFor(product.kind, product.packageId);
    if (!pp) {
        if (mount) mount.innerHTML = `<p class="paypal-mount-msg paypal-mount-err">PayPal is not configured for this package. Try another or contact support.</p>`;
        return;
    }

    // Intent record — webhook later matches package + uid
    try {
        const ref = await addDoc(collection(db, "boostOrders"), {
            uid: user.uid,
            kind: product.kind,
            packageId: product.packageId,
            name: product.name,
            pricePhp: product.pricePhp,
            hostedButtonId: pp.hostedButtonId,
            status: "pending_payment",
            replacesPackage: product.replacesPackage ?? null,
            durationDays: BOOST_DURATION_DAYS,
            createdAt: serverTimestamp(),
            /* BLAZE: set paidAt / activatedAt from webhook */
        });
        lastOrderId = ref.id;
    } catch (e) {
        console.warn("boostOrders write", e);
        lastOrderId = null;
    }

    try {
        const paypal = await loadPayPalSdk();
        if (mount) mount.innerHTML = "";
        const containerId = `paypal-container-${pp.hostedButtonId}`;
        const box = document.createElement("div");
        box.id = containerId;
        mount.appendChild(box);
        await paypal.HostedButtons({
            hostedButtonId: pp.hostedButtonId
            // BLAZE: when using JS SDK Orders API instead of Hosted Buttons,
            // use onApprove → call HTTPS function to verify + activate.
        }).render(`#${containerId}`);
        if (status) {
            status.classList.remove("is-hidden", "status-err");
            status.classList.add("status-ok");
            status.innerHTML = lastOrderId
                ? `Order <strong>pending verification</strong> (ref ${lastOrderId.slice(0, 8)}…). Perks unlock only after approval — not when PayPal closes.`
                : `Pay below. Boost stays <strong>pending</strong> until verified — not instant.`;
        }
    } catch (e) {
        console.error(e);
        if (mount) mount.innerHTML = `<p class="paypal-mount-msg paypal-mount-err">Could not load PayPal. Check your connection and try again.</p>`;
        if (status) {
            status.classList.remove("is-hidden", "status-ok");
            status.classList.add("status-err");
            status.textContent = "PayPal failed to load. You can retry or contact support — do not assume the boost is active.";
        }
    }
}

function packageBenefitsSeeker(p) {
    const bits = [];
    if (p.radiusBonusKm) bits.push(`+${p.radiusBonusKm} km discovery radius`);
    if (p.wantedBonus) bits.push(`+${p.wantedBonus} active wanted slot${p.wantedBonus > 1 ? "s" : ""}`);
    if (p.cooldownReduceH) bits.push(`−${p.cooldownReduceH}h pin move cooldown`);
    if (p.pinBonus) bits.push(`+${p.pinBonus} map pin slot (stackable; package 3/4/5 keep independent pin slots and cooldowns)`);
    if (p.matchNotices) bits.push("Match notices when listings fit your pin");
    if (p.canSave) bits.push("Save properties");
    if (p.featuredFilters) bits.push("Featured filter tools");
    return bits.join(" · ") || "Seeking Boost package";
}

function packageBenefitsOwner(p) {
    const bits = [];
    if (p.listingBonus) bits.push(`+${p.listingBonus} listing slot${p.listingBonus > 1 ? "s" : ""}`);
    if (p.imagesBonus) bits.push(`+${p.imagesBonus} photo${p.imagesBonus > 1 ? "s" : ""} per listing`);
    if (p.pinBonus) bits.push(`+${p.pinBonus} map pin slot (stackable; package 3/4/5 keep independent pin slots and cooldowns)`);
    if (p.wantedNotices) bits.push("Wanted match notices");
    /* Wanted tab is free for owners — do not market it as a boost unlock */
    return bits.join(" · ") || "Listing Boost package";
}

/** Fill #boost-packages-list — seekers / owners / brokers (both). */
export async function renderBoostPackagesList() {
    const list = document.getElementById("boost-packages-list");
    if (!list) return;
    let role = "seeker";
    try { role = await getRole(); } catch (_) {}

    const blocks = [];
    const showSeeker = role === "seeker" || role === "broker";
    const showOwner = role === "owner" || role === "broker";

    if (showSeeker) {
        blocks.push(`<h3 class="boost-catalog-heading">Seeking Boost</h3><p class="field-hint boost-catalog-lead">Wider radius, more wanted slots, shorter pin cooldown. Packages 4–5 also add a <strong>map pin slot</strong> (max 3 pins with tier).</p>`);
        for (let id = 1; id <= 5; id++) {
            const p = SEEKER_BOOST_PACKAGES[id];
            blocks.push(packageCard("seeker", p, packageBenefitsSeeker(p)));
        }
    }
    if (showOwner) {
        blocks.push(`<h3 class="boost-catalog-heading">Listing Boost</h3><p class="field-hint boost-catalog-lead">More listings and photos. Packages 4–5 add a <strong>map pin slot</strong>. Wanted discovery stays free — boost only adds capacity.</p>`);
        for (let id = 1; id <= 5; id++) {
            const p = OWNER_BOOST_PACKAGES[id];
            blocks.push(packageCard("owner", p, packageBenefitsOwner(p)));
        }
    }
    if (role === "broker") {
        blocks.unshift(`<p class="field-hint">Brokers can buy <strong>both</strong> Seeker and Owner packages.</p>`);
    }
    list.innerHTML = blocks.join("") || `<p class="panel-empty">No packages for this role.</p>`;
    wireOrderButtons();
    lockLowerBoostButtons();
}

function packageCard(kind, p, benefits) {
    const code = kind === "seeker" ? `S${p.id}` : `L${p.id}`;
    const pinBadge = p.pinBonus
      ? `<span class="boost-pkg-badge" title="Adds a Market map pin slot">+${p.pinBonus} pin slot</span>`
      : "";
    return `
      <article class="boost-package-card" data-boost-kind="${kind}" data-package-id="${p.id}">
        <div class="boost-package-head">
          <strong><span class="boost-pkg-code">${code}</span> ${p.name}</strong>
          <span class="boost-package-price">${formatPhp(p.pricePhp)}</span>
        </div>
        ${pinBadge}
        <p class="field-hint">${benefits}</p>
        <button type="button" class="primary-btn boost-order-btn"
          data-boost-kind="${kind}" data-package-id="${p.id}">
          Order ${code} · PayPal
        </button>
        <p class="boost-package-pending-hint">After pay: <strong>pending</strong> until verified · then ${BOOST_DURATION_DAYS} days of capacity</p>
      </article>`;
}

function wireOrderButtons() {
    document.querySelectorAll(".boost-order-btn").forEach(btn => {
        if (btn.dataset.wired) return;
        btn.dataset.wired = "1";
        btn.addEventListener("click", async () => {
            const kind = btn.dataset.boostKind;
            const id = Number(btn.dataset.packageId || 0);
            if (btn.disabled) return;
            let current = 0;
            try {
                const snap = await getDocs(query(collection(db, "boostOrders"), where("uid", "==", user.uid)));
                snap.forEach(d => {
                    const data = d.data() || {};
                    if (data.kind !== kind) return;
                    const st = String(data.status || "").toLowerCase();
                    if (!["pending", "pending_payment", "approved", "active"].includes(st)) return;
                    const pid = Number(data.packageId);
                    if (pid > current) current = pid;
                });
            } catch (_) {}
            if (id < current) {
                showAlert("Choose a higher package. Equal or lower boosts stay locked while one is pending or active.");
                return;
            }
            if (id > current && current > 0) {
                const ok = confirm(
                    "Upgrade to " + id + "?\n\n" +
                    "• Package " + current + " becomes ineffective when this higher order is activated.\n" +
                    "• Not refundable.\n\nContinue?"
                );
                if (!ok) return;
            }
            const p = kind === "seeker" ? seekerBoostPackage(id) : ownerBoostPackage(id);
            openBoostOrder({
                kind,
                packageId: id,
                name: p.name,
                pricePhp: p.pricePhp,
                replacesPackage: id > current ? current : null
            });
        });
    });
}

async function lockLowerBoostButtons() {
    try {
        const maxByKind = { seeker: -1, owner: -1 };
        const snap = await getDocs(query(collection(db, "boostOrders"), where("uid", "==", user.uid)));
        snap.forEach(d => {
            const data = d.data() || {};
            const st = String(data.status || "").toLowerCase();
            if (!["pending", "pending_payment", "approved", "active"].includes(st)) return;
            const kind = data.kind === "owner" ? "owner" : "seeker";
            const pid = Number(data.packageId);
            if (!Number.isNaN(pid) && pid > maxByKind[kind]) maxByKind[kind] = pid;
        });
        document.querySelectorAll(".boost-order-btn").forEach(btn => {
            const kind = btn.dataset.boostKind === "owner" ? "owner" : "seeker";
            const id = Number(btn.dataset.packageId);
            const maxLocked = maxByKind[kind];
            if (maxLocked < 0 || Number.isNaN(id)) return;
            if (id <= maxLocked) {
                btn.disabled = true;
                btn.classList.add("boost-locked");
                btn.textContent = id === maxLocked ? "Current / Pending" : "Locked (lower)";
            }
        });
    } catch (e) {
        console.warn("boost lock", e);
    }
}

/* Open catalog when boost modal opens */
document.getElementById("boost-packages-modal")?.addEventListener("click", () => {}, true);

const _origOpen = window.openBoostPackagesModal;
export async function refreshBoostCatalog() {
    await renderBoostPackagesList();
}

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("boost-packages-list");
    if (list) renderBoostPackagesList();
});

// Re-render when boost modal becomes visible
const obsTarget = document.getElementById("boost-packages-modal");
if (obsTarget) {
    const mo = new MutationObserver(() => {
        if (obsTarget.classList.contains("is-open") || obsTarget.style.display === "flex") {
            renderBoostPackagesList();
        }
    });
    mo.observe(obsTarget, { attributes: true, attributeFilter: ["class", "style"] });
}

lockLowerBoostButtons();


/** @deprecated use wireOrderButtons via renderBoostPackagesList */
export function wireBoostOrderButtons(mount) {
    wireOrderButtons();
}
