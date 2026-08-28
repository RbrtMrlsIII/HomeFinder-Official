/* Browser alerts for staff when pending work exists */
import { db, staffRole } from "./core.js";
import { collection, onSnapshot, query, where, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let lastOrders = 0;
let lastTickets = 0;

function notify(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        try { new Notification(title, { body }); } catch (_) {}
    } else if (Notification.permission === "default") {
        Notification.requestPermission();
    }
    // Also flash document title
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = `(!) ${base}`;
    setTimeout(() => { document.title = base; }, 4000);
}

export function startStaffAlerts() {
    // boostOrders pending
    try {
        onSnapshot(collection(db, "boostOrders"), (snap) => {
            const n = snap.docs.filter(d => (d.data().status || "pending") === "pending").length;
            if (n > lastOrders) notify("HomeFinder Admin", `${n} pending boost order(s)`);
            lastOrders = n;
            const el = document.getElementById("orders-pending-count");
            if (el) { el.hidden = n === 0; el.textContent = String(n); }
        });
    } catch (e) { console.warn(e); }

    try {
        const role = String(staffRole || "").toLowerCase() === "super"
            ? "admin"
            : (String(staffRole || "").toLowerCase() === "moderator" ? "moderator" : "staff");
        const ticketQuery = role === "admin"
            ? collection(db, "supportTickets")
            : query(collection(db, "supportTickets"), where("assignedRole", "==", role));
        onSnapshot(ticketQuery, (snap) => {
            const n = snap.docs.filter(d => {
                const data = d.data();
                return (data.status || "open") === "open" && !data.assignedTo;
            }).length;
            if (n > lastTickets) notify("HomeFinder Support", `${n} unclaimed ${role} support ticket(s)`);
            lastTickets = n;
            const el = document.getElementById("support-tab-count");
            if (el) { el.hidden = n === 0; el.textContent = String(n); }
        });
    } catch (e) { console.warn(e); }
}

startStaffAlerts();
