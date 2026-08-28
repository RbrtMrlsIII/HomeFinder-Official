/* Reviews tab — owner/broker: inbox on my properties; seeker: my submitted reviews */
import { user, db } from "./core.js";
import { getRole } from "./role.js";
import {
    collection, query, where, orderBy, getDocs, getDoc, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { listPropertyListingsForOwner, getPropertyListing } from "../collections.js";

function starsHTML(rating) {
    const n = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, i) =>
        `<i class='bx ${i < n ? "bxs-star" : "bx-star"} u-star'></i>`
    ).join("");
}

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function ownerReviewCard(propertyId, reviewId, r, listingTitle) {
    return `
        <div class="panel-card u-pad-16 u-mb-14">
            <div class="u-flex-between">
                <div>
                    <div class="u-text-12 u-text-muted u-mb-4">${escapeHtml(listingTitle)}</div>
                    <div>${starsHTML(r.rating)}</div>
                </div>
            </div>
            ${r.comment ? `<p class="u-text-13-5 u-text-secondary u-mt-8">${escapeHtml(r.comment)}</p>` : ""}
            ${r.reply ? `
                <div class="u-reply-box">
                    <div class="u-text-11-5 u-text-muted u-mb-4">YOUR REPLY</div>
                    <div class="u-text-13 u-text-secondary">${escapeHtml(r.reply)}</div>
                </div>
            ` : `
                <div class="reply-form u-mt-10 u-flex-gap-8" data-property-id="${propertyId}" data-review-id="${reviewId}">
                    <input type="text" class="reply-input" placeholder="Write a reply..." />
                    <button type="button" class="secondary-btn reply-submit-btn u-btn-compact-pad">Reply</button>
                </div>
            `}
        </div>`;
}

function seekerReviewCard(propertyId, r, listingTitle) {
    return `
        <div class="panel-card u-pad-16 u-mb-14">
            <div class="u-text-12 u-text-muted u-mb-4">${escapeHtml(listingTitle || propertyId)}</div>
            <div>${starsHTML(r.rating)}</div>
            ${r.comment ? `<p class="u-text-13-5 u-text-secondary u-mt-8">${escapeHtml(r.comment)}</p>` : ""}
            ${r.reply ? `
                <div class="u-reply-box">
                    <div class="u-text-11-5 u-text-muted u-mb-4">OWNER REPLY</div>
                    <div class="u-text-13 u-text-secondary">${escapeHtml(r.reply)}</div>
                </div>
            ` : ""}
            <p class="u-text-12 u-text-muted u-mt-8">
              <a href="market.html#listing-${escapeHtml(propertyId)}">View listing</a>
            </p>
        </div>`;
}

async function renderOwnerReviews(container) {
    const propRows = await listPropertyListingsForOwner(db, user.uid, { collection, query, where, getDocs });
    const properties = propRows.map((r) => ({ id: r.id, data: r.data }));

    if (properties.length === 0) {
        container.innerHTML = `
            <div class="panel-empty">
                <i class='bx bx-star'></i>
                <p>List a property to start receiving reviews.</p>
            </div>`;
        return;
    }

    const allReviews = [];
    await Promise.all(properties.map(async (p) => {
        try {
            const reviewsSnap = await getDocs(
                query(collection(db, "propertyListings", p.id, "reviews"), orderBy("createdAt", "desc"))
            );
            reviewsSnap.forEach(reviewDoc => {
                allReviews.push({
                    propertyId: p.id,
                    reviewId: reviewDoc.id,
                    data: reviewDoc.data(),
                    listingTitle: p.data.listing_title || p.data.title || "Untitled listing"
                });
            });
        } catch (e) {
            console.warn("reviews fetch", p.id, e);
        }
    }));

    if (!allReviews.length) {
        container.innerHTML = `
            <div class="panel-empty">
                <i class='bx bx-star'></i>
                <p>No reviews on your listings yet.</p>
            </div>`;
        return;
    }

    container.innerHTML = allReviews
        .map(r => ownerReviewCard(r.propertyId, r.reviewId, r.data, r.listingTitle))
        .join("");

    container.querySelectorAll(".reply-form").forEach(wrap => {
        const btn = wrap.querySelector(".reply-submit-btn");
        const input = wrap.querySelector(".reply-input");
        btn?.addEventListener("click", async () => {
            const text = (input?.value || "").trim();
            if (!text) return;
            btn.disabled = true;
            try {
                await updateDoc(
                    doc(db, "propertyListings", wrap.dataset.propertyId, "reviews", wrap.dataset.reviewId),
                    { reply: text }
                );
                await renderOwnerReviews(container);
            } catch (e) {
                alert("Reply failed: " + (e.message || e));
                btn.disabled = false;
            }
        });
    });
}

async function renderSeekerReviews(container) {
    container.innerHTML = `<div class="panel-empty"><p>Loading your reviews…</p></div>`;
    let contracts = [];
    try {
        const snap = await getDocs(
            query(
                collection(db, "contracts"),
                where("seekerId", "==", user.uid),
                where("status", "==", "completed")
            )
        );
        snap.forEach(d => contracts.push({ id: d.id, ...d.data() }));
    } catch (e) {
        console.warn("seeker contracts", e);
    }

    if (!contracts.length) {
        container.innerHTML = `
            <div class="panel-empty">
                <i class='bx bx-star'></i>
                <p>After a completed stay, you can rate the property from the marketplace listing.</p>
                <p class="u-text-12 u-text-muted u-mt-8">
                  <a href="market.html">Open marketplace</a> to browse and, when eligible, leave a review.
                </p>
            </div>`;
        return;
    }

    const cards = [];
    await Promise.all(contracts.map(async (c) => {
        const propertyId = c.propertyId;
        if (!propertyId) return;
        let title = c.listingTitle || propertyId;
        try {
            const pOne = await getPropertyListing(db, propertyId, { getDoc, doc });
            const pSnap = { empty: !pOne.exists(), docs: pOne.exists() ? [pOne] : [] };
            // prefer getDoc style - use doc path via query on reviews by userId
        } catch (_) { /* ignore */ }
        try {
            const rq = query(
                collection(db, "propertyListings", propertyId, "reviews"),
                where("userId", "==", user.uid)
            );
            const rs = await getDocs(rq);
            if (rs.empty) {
                cards.push(`
                  <div class="panel-card u-pad-16 u-mb-14">
                    <div class="u-text-12 u-text-muted">Property ${escapeHtml(propertyId)}</div>
                    <p class="u-text-13-5">Stay completed — leave a review on the listing page.</p>
                    <a class="primary-btn u-mt-8" href="market.html#listing-${escapeHtml(propertyId)}">Rate on marketplace</a>
                  </div>`);
                return;
            }
            rs.forEach(rd => {
                cards.push(seekerReviewCard(propertyId, rd.data(), title));
            });
        } catch (e) {
            console.warn("seeker review", propertyId, e);
        }
    }));

    if (!cards.length) {
        container.innerHTML = `
            <div class="panel-empty">
                <i class='bx bx-star'></i>
                <p>No reviews written yet. Rate eligible listings from the marketplace after a completed contract.</p>
                <p><a href="market.html">Go to marketplace</a></p>
            </div>`;
        return;
    }
    container.innerHTML = cards.join("");
}

async function boot() {
    if (!user) return;
    const container = document.getElementById("owner-reviews-list");
    if (!container) return;

    const role = await getRole();
    const heading = document.querySelector("#panel-reviews .panel-card h2, #panel-reviews h2");
    if (role === "seeker") {
        if (heading) heading.textContent = "My reviews";
        await renderSeekerReviews(container);
    } else {
        if (heading) heading.textContent = "Reviews on your listings";
        await renderOwnerReviews(container);
    }
}

// Re-render when tab opens
document.addEventListener("hf:tab-activated", (e) => {
    if (e.detail?.tab === "reviews") boot();
});

boot();
