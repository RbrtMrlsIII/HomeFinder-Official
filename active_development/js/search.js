/* ================================ */
/*  SEARCH                          */
/* ================================ */
/* Navbar scroll state + search overlay. */

const navbar = document.querySelector(".navbar");

function updateNavState(){

    if (!navbar) return; 
    
    const scrolled = window.scrollY > 24;
    if (navbar) navbar.classList.toggle("scrolled", scrolled);
    const header = document.querySelector("header.header");
    if (header) header.classList.toggle("is-scrolled", scrolled);
}
window.addEventListener("scroll", updateNavState);

/*======================================*/
/* UNIVERSAL SEARCH OVERLAY              */
/*======================================*/

const searchBtn = document.getElementById("universal-search-btn");
const overlay = document.getElementById("search-overlay");
const backdrop = document.getElementById("search-backdrop");
const closeBtn = document.getElementById("search-close-btn");
const input = document.getElementById("universal-search-input");
const results = document.getElementById("search-results");
const tabs = document.querySelectorAll(".search-tab");

let activeCategory = "pages";

// real, works today -- searches your actual site pages
const pages = [
    { name:"Home", icon:"bx-home", href:"index.html#home" },
    { name:"Featured Properties", icon:"bx-buildings", href:"index.html#properties" },
    { name:"Market", icon:"bx-map", href:"market.html" },
    { name:"About", icon:"bx-info-circle", href:"index.html#about" },
    { name:"Contact", icon:"bx-envelope", href:"index.html#contact" },
    { name:"Login", icon:"bx-log-in", href:"login.html" },
    { name:"Register", icon:"bx-user-plus", href:"register.html" },
    { name:"My Profile", icon:"bx-user-circle", href:"profile.html" }
];

function openSearch(){
    if (!overlay || !input) return;
    overlay.classList.add("active");
    input.value = "";
    input.focus();
    renderResults("");
}

function closeSearch(){
    if (overlay) overlay.classList.remove("active");
}

if(searchBtn) searchBtn.addEventListener("click", openSearch);
if(closeBtn) closeBtn.addEventListener("click", closeSearch);
if(backdrop) backdrop.addEventListener("click", closeSearch);

document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") closeSearch();
});

// SAFE GUARD: Only bind click handlers if tabs exist on the active page viewport
if (tabs && tabs.length > 0) {
    tabs.forEach(tab=>{
        tab.addEventListener("click", ()=>{
            tabs.forEach(t=> t.classList.remove("active"));
            tab.classList.add("active");
            activeCategory = tab.dataset.cat;
            renderResults(input ? input.value : "");
        });
    });
}

if(input){
    input.addEventListener("input", ()=> renderResults(input.value));
}

function renderResults(query){
    if (!results) return; // Prevent breakdown if results container is missing
    const q = query.trim().toLowerCase();

    if(activeCategory === "pages"){
        const matches = pages.filter(p => p.name.toLowerCase().includes(q));
        if(matches.length === 0){
            results.innerHTML = `<p class="search-empty">No pages match "${query}"</p>`;
            return;
        }
        results.innerHTML = matches.map(p => `
            <a href="${p.href}" class="search-result-item">
                <i class='bx ${p.icon}'></i>
                <div><strong>${p.name}</strong></div>
            </a>
        `).join("");
        return;
    }

    if(activeCategory === "properties"){
        results.innerHTML = `
            <a href="market.html" class="search-result-item">
                <i class='bx bx-store-alt'></i>
                <div>
                    <strong>Open Market</strong>
                    <span>Pin + radius discovery for properties and wanted (SoT)</span>
                </div>
            </a>
            <a href="index.html#properties" class="search-result-item">
                <i class='bx bx-buildings'></i>
                <div>
                    <strong>Featured on Home</strong>
                    <span>Curated samples / live featured strip</span>
                </div>
            </a>
            <p class="search-empty">Type/price/amenities filters live on Market after you set a pin — not in this search box.</p>
        `;
        return;
    }

    if(activeCategory === "users"){
        results.innerHTML = `<p class="search-empty">
            User search will be available once user profiles are searchable in Firestore.
        </p>`;
        return;
    }

    if(activeCategory === "map"){
        const qLabel = query.trim() ? escapeSearch(query.trim()) : "your area";
        results.innerHTML = `
            <a href="market.html" class="search-result-item">
                <i class='bx bx-map-pin'></i>
                <div>
                    <strong>Market pin &amp; radius</strong>
                    <span>Drop a pin on Market to search near ${qLabel}. Live listings after sign-in.</span>
                </div>
            </a>
            <a href="index.html#map" class="search-result-item">
                <i class='bx bx-map-alt'></i>
                <div>
                    <strong>Home map preview</strong>
                    <span>Demo only — not the discovery pin authority</span>
                </div>
            </a>
        `;
    }
}

function escapeSearch(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

}
