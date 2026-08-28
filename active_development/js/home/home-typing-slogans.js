
const featuredLines = [
  "Bedspaces near campuses…",
  "Family homes with clear deposits…",
  "Retail corners ready for tenants…",
  "Warehouses for growing operations…"
];
const contactLines = [
  "Verification usually within 48 hours…",
  "Support tickets reviewed by staff…",
  "Report issues — we take trust seriously…"
];

function typeCycle(el, lines, i = 0) {
  if (!el || !lines.length) return;
  const text = lines[i % lines.length];
  let n = 0;
  el.textContent = "";
  const tick = () => {
    n++;
    el.textContent = text.slice(0, n);
    if (n < text.length) setTimeout(tick, 36);
    else setTimeout(() => {
      el.textContent = "";
      typeCycle(el, lines, i + 1);
    }, 2200);
  };
  tick();
}

typeCycle(document.getElementById("featured-typing"), featuredLines);
typeCycle(document.getElementById("contact-typing"), contactLines);
