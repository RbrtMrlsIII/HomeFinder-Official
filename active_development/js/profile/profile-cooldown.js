/* Name, phone, address — independent 30-day cooldowns */
import { user, db } from "./core.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

function normalizePhone(phone) {
    const raw = String(phone || "").replace(/\D/g, "");
    if (/^09\d{9}$/.test(raw)) return `63${raw.slice(1)}`;
    if (/^63\d{10}$/.test(raw)) return raw;
    return "";
}

function daysLeft(iso) {
    if (!iso) return 0;
    const t = typeof iso?.toDate === "function" ? iso.toDate().getTime() : new Date(iso).getTime();
    if (Number.isNaN(t)) return 0;
    const left = COOLDOWN_MS - (Date.now() - t);
    return left <= 0 ? 0 : Math.ceil(left / (24 * 60 * 60 * 1000));
}

function nextDateLabel(iso) {
    if (!iso) return null;
    try {
        const d = typeof iso?.toDate === "function" ? iso.toDate() : new Date(iso);
        if (Number.isNaN(d.getTime())) return null;
        const unlock = new Date(d.getTime() + COOLDOWN_MS);
        return unlock.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (_) {
        return null;
    }
}

/** @returns {{ locked: boolean, days: number, nextLabel: string|null, changedAt: any }} */
export function cooldownFromTimestamp(iso) {
    const days = daysLeft(iso);
    return {
        locked: days > 0,
        days,
        nextLabel: days > 0 ? nextDateLabel(iso) : null,
        changedAt: iso || null,
    };
}

export async function loadIdentityCooldowns() {
    if (!user?.uid) {
        return {
            name: cooldownFromTimestamp(null),
            phone: cooldownFromTimestamp(null),
            address: cooldownFromTimestamp(null),
            data: {},
        };
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.exists() ? snap.data() : {};
    return {
        name: cooldownFromTimestamp(data.nameChangedAt),
        phone: cooldownFromTimestamp(data.phoneChangedAt),
        address: cooldownFromTimestamp(data.addressChangedAt),
        data,
    };
}

export async function assertNameChangeAllowed() {
    const { name } = await loadIdentityCooldowns();
    if (name.locked) {
        throw new Error(
            `You can change your name again in ${name.days} day(s) (unlocks ${name.nextLabel || "after 30 days"}). Only this field is locked.`
        );
    }
}

export async function assertPhoneChangeAllowed(newPhone) {
    const { phone, data } = await loadIdentityCooldowns();
    if (phone.locked) {
        throw new Error(
            `You can change your mobile number again in ${phone.days} day(s) (unlocks ${phone.nextLabel || "after 30 days"}). Only this field is locked.`
        );
    }
    const digits = normalizePhone(newPhone);
    if (digits.length < 10) throw new Error("Enter a valid mobile number (at least 10 digits).");
    if (digits === normalizePhone(data.phone)) return;
    try {
        const idx = await getDoc(doc(db, "phoneIndex", digits));
        if (idx.exists() && idx.data().uid !== user.uid) {
            throw new Error("This mobile number is already used by another account.");
        }
    } catch (e) {
        if (e.message && e.message.includes("already used")) throw e;
    }
}

export async function assertAddressChangeAllowed() {
    const { address } = await loadIdentityCooldowns();
    if (address.locked) {
        throw new Error(
            `You can change your address again in ${address.days} day(s) (unlocks ${address.nextLabel || "after 30 days"}). Only this field is locked.`
        );
    }
}

export async function applyNameChange(firstName, surname, middleInitial, { skipConfirm = false } = {}) {
    await assertNameChangeAllowed();
    if (!skipConfirm) {
        const ok = confirm(
            "Name change\n\nYou can only change your name once every 30 days.\nPhone and address stay editable on their own timers.\n\nContinue?"
        );
        if (!ok) throw new Error("Cancelled");
    }
    await updateDoc(doc(db, "users", user.uid), {
        firstName: firstName.trim(),
        surname: surname.trim(),
        middleInitial: (middleInitial || "").trim(),
        nameChangedAt: new Date().toISOString(),
    });
    try {
        await addNotif("Your display name was updated. Name is locked for 30 days (phone and address are separate).");
    } catch (_) {}
}

export async function applyPhoneChange(phone, { skipConfirm = false } = {}) {
    await assertPhoneChangeAllowed(phone);
    if (!skipConfirm) {
        const ok = confirm(
            "Mobile number change\n\nYou can only change your mobile once every 30 days.\nName and address stay on their own timers.\nThis number cannot be used on another account.\n\nContinue?"
        );
        if (!ok) throw new Error("Cancelled");
    }
    const digits = normalizePhone(phone);
    if (digits.length !== 12) {
        throw new Error("Enter a valid Philippine mobile number as exactly 12 digits (639XXXXXXXXX).");
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    const oldDigits = normalizePhone(snap.exists() ? snap.data().phone : "");
    await updateDoc(doc(db, "users", user.uid), {
        phone: phone.trim(),
        phoneDigits: digits,
        phoneChangedAt: new Date().toISOString(),
    });
    // Phone uniqueness is reserved only by the trusted Phone Auth verification
    // flow. A profile edit must never manufacture a phone claim merely because
    // the client supplied a 12-digit string.

    try {
        await addNotif("Your mobile number was updated. Phone is locked for 30 days (name and address are separate).");
    } catch (_) {}
}

export async function applyAddressChange(address, { skipConfirm = false } = {}) {
    await assertAddressChangeAllowed();
    if (!skipConfirm) {
        const ok = confirm(
            "Address change\n\nYou can only change your address once every 30 days.\nName and phone stay on their own timers.\n\nContinue?"
        );
        if (!ok) throw new Error("Cancelled");
    }
    const payload =
        typeof address === "string"
            ? { address: address.trim(), addressChangedAt: new Date().toISOString() }
            : { address, addressChangedAt: new Date().toISOString() };
    try {
        await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    } catch (err) {
        const code = err?.code || "";
        if (code === "permission-denied") {
            throw new Error(
                "Could not save address (permission denied). Deploy latest firestore.rules so addressChangedAt is allowed on users/{uid}."
            );
        }
        throw err;
    }
    try {
        await addNotif("Your address was updated. Address is locked for 30 days (name and phone are separate).");
    } catch (_) {}
}

async function addNotif(message) {
    const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await addDoc(collection(db, "notifications", user.uid, "items"), {
        type: "profile_cooldown",
        message,
        read: false,
        createdAt: new Date().toISOString(),
    });
}

/**
 * Independent mini-cards: lock only the field whose timer is active.
 */
export async function applyIdentityCooldownUI() {
    const states = await loadIdentityCooldowns();
    const d = states.data || {};

    setFieldCooldownUI({
        key: "name",
        state: states.name,
        inputIds: ["p-first-name", "p-surname", "p-middle-initial"],
        saveBtnId: "save-name-btn",
        cardId: "identity-cooldown-name",
        title: "Display name",
        valueText: `${d.firstName || ""} ${d.surname || ""}`.trim() || "—",
        guide: "You can change your name once every 30 days. Phone and address have separate timers.",
    });

    setFieldCooldownUI({
        key: "phone",
        state: states.phone,
        inputIds: ["p-phone"],
        saveBtnId: "save-phone-btn",
        cardId: "identity-cooldown-phone",
        title: "Mobile",
        valueText: d.phone || "—",
        guide: "You can change your mobile once every 30 days. Name and address have separate timers.",
    });

    const addr =
        typeof d.address === "string"
            ? d.address
            : d.address && typeof d.address === "object"
              ? [d.address.line, d.address.city, d.address.province].filter(Boolean).join(", ")
              : "";
    setFieldCooldownUI({
        key: "address",
        state: states.address,
        inputIds: ["p-address"],
        saveBtnId: "save-address-btn",
        cardId: "identity-cooldown-address",
        title: "Address",
        valueText: addr || "—",
        guide: "You can change your address once every 30 days. Name and phone have separate timers.",
    });

    return states;
}

function setFieldCooldownUI({ key, state, inputIds, saveBtnId, cardId, title, valueText, guide }) {
    const card = document.getElementById(cardId);
    const saveBtn = document.getElementById(saveBtnId);
    const locked = !!state?.locked;

    inputIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.readOnly = locked;
        el.disabled = locked;
        el.classList.toggle("is-cooldown-locked", locked);
        const group = el.closest(".field-group");
        if (group) group.classList.toggle("is-cooldown-locked", locked);
        if (saveBtn) {
            const wrap = saveBtn.closest(".identity-field-block") || saveBtn.parentElement;
            wrap?.classList.toggle("is-cooldown-locked", locked);
        }
    });

    if (saveBtn) {
        saveBtn.hidden = locked;
        saveBtn.disabled = locked;
    }

    const block = document.querySelector(`[data-identity-field="${key}"]`);
    if (block) {
        block.classList.toggle("is-cooldown-locked", locked);
    }
    const edit = document.querySelector(`[data-identity-edit="${key}"]`);
    if (edit) {
        edit.hidden = locked;
    }

    if (!card) return;
    card.hidden = !locked;
    if (!locked) return;

    const pill = card.querySelector("[data-cooldown-pill]");
    const valueEl = card.querySelector("[data-cooldown-value]");
    const timingEl = card.querySelector("[data-cooldown-timing]");
    const guideEl = card.querySelector("[data-cooldown-guide]");
    if (pill) {
        pill.textContent = state.days === 1 ? "Locked · 1 day left" : `Locked · ${state.days} days left`;
        pill.dataset.state = "locked";
    }
    if (valueEl) valueEl.textContent = valueText || "—";
    if (timingEl) {
        timingEl.textContent = state.nextLabel
            ? `Next change on ${state.nextLabel}`
            : `Unlocks in ${state.days} day(s)`;
    }
    if (guideEl) guideEl.textContent = guide;
}
