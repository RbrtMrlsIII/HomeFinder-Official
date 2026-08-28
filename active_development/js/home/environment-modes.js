/* A.4.5 foundation: environmental states shared by cinematic world + UI. */
(() => {
  'use strict';
  const url = 'data/environment-modes.json';
  const root = document.documentElement;
  let config = null;
  const storageKey = 'homefinder.environment';
  const apply = (id, announce = true) => {
    if (!config?.modes?.[id]) return false;
    const mode = config.modes[id];
    root.dataset.environment = id;
    try { window.hfDesignRoots?.setEnvironment(id); } catch (_) {}
    root.dataset.environmentLabel = mode.label;
    root.style.setProperty('--hf-env-ambient', String(mode.ambient));
    root.style.setProperty('--hf-env-interior', String(mode.interior));
    root.style.setProperty('--hf-env-rain', String(mode.rain));
    try { localStorage.setItem(storageKey, id); } catch (_) {}
    document.querySelectorAll('[data-environment-mode]').forEach(b => {
      b.toggleAttribute('aria-pressed', b.dataset.environmentMode === id);
    });
    if (announce) window.dispatchEvent(new CustomEvent('hf:environment-change', {detail:{id, mode}}));
    return true;
  };
  const mount = () => {
    const existing = document.querySelector('[data-environment-switcher]');
    if (existing || !config) return;
    const host = document.querySelector('[data-cinematic-focal="hero-residence"]');
    if (!host) return;
    const panel = document.createElement('div');
    panel.className = 'hf-environment-switcher';
    panel.setAttribute('data-environment-switcher','');
    panel.innerHTML = `<span class="hf-env-caption">House atmosphere</span><div class="hf-env-options" role="group" aria-label="Choose house atmosphere">${Object.entries(config.modes).map(([id,m]) => `<button type="button" data-environment-mode="${id}" aria-label="${m.label} atmosphere" aria-pressed="false" title="${m.label}"><i class="bx ${m.icon}" aria-hidden="true"></i><span>${m.label}</span></button>`).join('')}</div>`;
    host.appendChild(panel);
    panel.addEventListener('click', e => { const b=e.target.closest('[data-environment-mode]'); if(b) apply(b.dataset.environmentMode); });
  };
  fetch(url,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
    config=data; mount();
    let saved=null; try {saved=localStorage.getItem(storageKey);} catch(_){}
    apply(saved && config.modes[saved] ? saved : config.default, false);
  }).catch(()=>{});
  window.hfEnvironment = { set: id => apply(id), get: () => root.dataset.environment || config?.default || 'day' };
})();
