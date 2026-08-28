import { authReady } from "../session.js";
import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* HF-BUILD-2026-08-11-V13 | file: navbar.js | DO NOT USE OLD CACHE PATH */
/* ================================ */
/*  NAVBAR                          */
/* ================================ */
/* Button press feedback + scroll-reveal animations. */

const buttons = document.querySelectorAll("button");
buttons.forEach(button=>{
    button.addEventListener("click",()=>{
        button.style.transform="scale(.96)";
        setTimeout(()=>{
            button.style.transform="";
        },150);
    });
});

/*================================*/
/* SCROLL-REVEAL ANIMATION */
/*================================*/

const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.classList.add("show");
        }
    });
},{ threshold:.15 });

document.querySelectorAll(".trust-item,.properties,.map-section")
    .forEach(element=>{
        observer.observe(element);
    });
    
/*================================*/
/* SCROLL → glass header state    */
/*================================*/
(function () {
    const header = document.querySelector("header.header");
    if (!header) return;
    const onScroll = () => {
        if (window.scrollY > 24) header.classList.add("is-scrolled");
        else header.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
})();

/*================================*/
/* Dev banner + header geometry   */
/*================================*/
/* header.header and .floating-register (navbar.css) read these vars
   for their fixed top offsets instead of assuming the banner/header
   are a fixed height. */
(function () {
    const banner = document.querySelector(".hf-dev-banner");
    const header = document.querySelector("header.header");
    const root = document.documentElement;
    if (!banner && !header) return;

    const syncGeometry = () => {
        if (banner) root.style.setProperty("--dev-banner-height", banner.offsetHeight + "px");
        if (header) root.style.setProperty("--home-header-height", header.offsetHeight + "px");
    };
    syncGeometry();

    if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(syncGeometry);
        if (banner) ro.observe(banner);
        if (header) ro.observe(header);
    }
    window.addEventListener("resize", syncGeometry);
})();


/*================================*/
/* Auth-aware header actions      */
/*================================*/
(function () {
  function syncHomeAuth(user) {
    document.querySelectorAll("[data-auth=guest]").forEach((el) => {
      el.hidden = !!user;
    });
    document.querySelectorAll("[data-auth=user]").forEach((el) => {
      el.hidden = !user;
    });
    document.body.classList.toggle("hf-signed-in", !!user);
    document.body.classList.toggle("hf-guest", !user);
  }

  authReady
    .then((user) => syncHomeAuth(user))
    .catch(() => syncHomeAuth(null));

  document.getElementById("home-logout-btn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn(err);
    }
    window.location.href = "index.html";
  });
})();
