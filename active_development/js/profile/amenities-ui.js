/**
 * Shared amenities category tabs + summary (List Property + Wanted).
 * Selections persist across tab switches; only visibility changes.
 */
export function wireAmenitiesBlock(root, options = {}) {
  if (!root || root.dataset.amenitiesWired === "1") return;
  root.dataset.amenitiesWired = "1";

  const inputName = options.inputName || "amenities[]";
  const summary =
    (options.summaryId && document.getElementById(options.summaryId)) ||
    root.querySelector(".amenities-selected-summary");

  const labels = {};
  root.querySelectorAll(`input[name="${inputName}"]`).forEach((el) => {
    const lab = el.closest("label");
    const text = lab ? lab.textContent.replace(/\s+/g, " ").trim() : el.value;
    labels[el.value] = text;
  });

  function selectedValues() {
    return [...root.querySelectorAll(`input[name="${inputName}"]:checked`)].map((el) => el.value);
  }

  function updateSummary() {
    if (!summary) return;
    const vals = selectedValues();
    if (!vals.length) {
      summary.textContent = "Selected: none";
      return;
    }
    const names = vals.map((v) => labels[v] || v);
    const head = names.slice(0, 4).join(" · ");
    const more = names.length > 4 ? ` · +${names.length - 4} more` : "";
    summary.textContent = `Selected: ${head}${more}`;
  }

  function updateBadges() {
    ["residential", "workspace", "industrial"].forEach((cat) => {
      const panel = root.querySelector(`[data-amenities-panel="${cat}"]`);
      const badge = root.querySelector(`[data-badge-for="${cat}"]`);
      if (!panel || !badge) return;
      const n = panel.querySelectorAll(`input[name="${inputName}"]:checked`).length;
      badge.textContent = String(n);
      badge.hidden = n === 0;
    });
  }

  function activateTab(cat) {
    root.querySelectorAll(".amenities-cat-tab").forEach((btn) => {
      const on = btn.getAttribute("data-amenities-tab") === cat;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    root.querySelectorAll(".amenities-cat-panel").forEach((panel) => {
      const on = panel.getAttribute("data-amenities-panel") === cat;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });
  }

  root.querySelectorAll(".amenities-cat-tab").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      activateTab(btn.getAttribute("data-amenities-tab"));
    });
  });

  root.addEventListener("change", (e) => {
    if (e.target?.matches?.(`input[name="${inputName}"]`)) {
      updateSummary();
      updateBadges();
    }
  });

  updateSummary();
  updateBadges();
  return { selectedValues, updateSummary };
}
