/** HomeFinder brand mark loader. Environment themes own palette; the brand mark itself is stable. */
(function(){
  const LOGO = "assets/images/logo-homefinder.png";
  function applyBrandLogos(){
    document.querySelectorAll("[data-hf-logo]").forEach(img=>{
      const base=img.getAttribute("data-hf-logo-base")||"";
      const src=base ? base+LOGO : LOGO;
      if(img.getAttribute("src")!==src) img.setAttribute("src",src);
      img.setAttribute("alt","HomeFinder logo");
    });
    const fav=document.querySelector('link[rel="icon"][data-hf-favicon]');
    if(fav){ const base=fav.getAttribute("data-hf-logo-base")||""; fav.href=base ? base+LOGO : LOGO; }
  }
  window.applyBrandLogos=applyBrandLogos;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",applyBrandLogos); else applyBrandLogos();
})();
