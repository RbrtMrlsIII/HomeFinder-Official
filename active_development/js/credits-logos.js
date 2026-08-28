/* Dynamic logo fetch for Credits section */
(function () {
  const grid = document.getElementById("credits-grid") || document.getElementById("market-credits-grid");
  if (!grid) return;

  function letterFallback(el, brand, color) {
    const logo = el.querySelector(".credit-logo");
    if (!logo) return;
    logo.innerHTML = "";
    logo.classList.add("credit-logo-fallback");
    logo.style.background = color || "#EFE5D2";
    const span = document.createElement("span");
    span.textContent = (brand || "?").slice(0, 2);
    span.style.color = (color === "#111111" || color === "#111") ? "#fff" : "#2C2621";
    span.style.fontWeight = "800";
    span.style.fontSize = "14px";
    logo.appendChild(span);
  }

  function tryLoad(img, urls, onFail) {
    let i = 0;
    const next = () => {
      if (i >= urls.length) {
        onFail();
        return;
      }
      const url = urls[i++];
      img.onload = () => {
        img.style.opacity = "1";
        img.alt = img.closest(".credit-card")?.dataset.brand || "";
      };
      img.onerror = next;
      img.src = url;
    };
    next();
  }

  grid.querySelectorAll(".credit-card[data-domain]").forEach((card) => {
    const domain = card.dataset.domain;
    const brand = card.dataset.brand || domain;
    const color = card.dataset.color || "#EFE5D2";
    const simple = card.dataset.simpleicon;
    const img = card.querySelector(".credit-logo img");
    if (!img) return;

    img.style.opacity = "0";
    img.style.transition = "opacity .25s ease";
    img.width = 32;
    img.height = 32;

    // Prefer Simple Icons (SVG) when slug known, then Google favicon, then DuckDuckGo icons
    const urls = [];
    if (simple) {
      urls.push(`https://cdn.simpleicons.org/${encodeURIComponent(simple)}`);
    }
    // common slug guesses
    const slugMap = {
      "firebase.google.com": "firebase",
      "supabase.com": "supabase",
      "claude.ai": "anthropic",
      "x.ai": "x",
    };
    const slug = slugMap[domain];
    if (slug && !simple) {
      urls.push(`https://cdn.simpleicons.org/${slug}`);
    }
    urls.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`);
    urls.push(`https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`);

    tryLoad(img, urls, () => letterFallback(card, brand, color));
  });
})();
