/* HomeFinder Cinematic 3D Asset Adapter
 * Phase A.2.3: renderer-neutral bridge for future GLB/KTX2 worlds.
 *
 * This file intentionally does NOT download or render a model by itself.
 * It establishes a stable contract so a Three.js/WebGL renderer can be
 * attached later without changing page HTML, routing, or scene ownership.
 */
(() => {
  const manifestUrl = 'data/cinematic-assets.json';
  let manifest = null;
  let renderer = null;
  let mounted = new Map();
  let ready = false;

  const supportsWebGL2 = () => {
    try {
      const c = document.createElement('canvas');
      return !!c.getContext('webgl2', { alpha: true, antialias: true });
    } catch (_) { return false; }
  };

  const getWorld = (worldId) => manifest?.worlds?.[worldId] || null;
  const getBudget = (worldId, tier) => getWorld(worldId)?.budgets?.[tier] || null;
  const getSlot = (worldId, slotId) => getWorld(worldId)?.slots?.[slotId] || null;

  const chooseSource = (slot, tier) => {
    if (!slot || !slot.source || !slot.lod?.includes(tier)) return null;
    if (typeof slot.source === 'string') return slot.source;
    return slot.source[tier] || slot.source.high || null;
  };

  async function loadManifest() {
    if (manifest) return manifest;
    try {
      const response = await fetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`manifest ${response.status}`);
      manifest = await response.json();
    } catch (_) {
      manifest = { version: 1, worlds: {} };
    }
    ready = true;
    window.dispatchEvent(new CustomEvent('hf:cinematic-3d-ready', { detail: api }));
    return manifest;
  }

  function mount(worldId, { tier = 'medium', backdrop = document.querySelector('.hf-cinematic-backdrop') } = {}) {
    const world = getWorld(worldId);
    if (!world || !backdrop || tier === 'low' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return { mounted: false, reason: 'fallback' };
    }
    const capability = supportsWebGL2();
    if (!capability && !renderer) return { mounted: false, reason: 'webgl2-unavailable' };

    let stage = backdrop.querySelector('.hf-cinematic-3d-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'hf-cinematic-3d-stage';
      stage.setAttribute('aria-hidden', 'true');
      stage.dataset.world = worldId;
      stage.dataset.tier = tier;
      backdrop.appendChild(stage);
    }

    const slots = Object.entries(world.slots || {}).map(([slotId, slot]) => ({
      slotId,
      source: chooseSource(slot, tier),
      fallback: slot.fallback,
      kind: slot.kind,
      priority: slot.priority
    }));

    mounted.set(worldId, { world, tier, stage, slots });
    if (renderer?.mountWorld) {
      renderer.mountWorld({ world, tier, stage, slots, budget: getBudget(worldId, tier) });
    }
    window.dispatchEvent(new CustomEvent('hf:cinematic-3d-mounted', {
      detail: { worldId, tier, slots, rendererAttached: !!renderer }
    }));
    return { mounted: true, worldId, tier, slots };
  }

  function unmount(worldId) {
    const state = mounted.get(worldId);
    if (!state) return;
    renderer?.unmountWorld?.({ world: state.world, stage: state.stage });
    state.stage?.remove();
    mounted.delete(worldId);
  }

  function registerRenderer(nextRenderer) {
    if (!nextRenderer || typeof nextRenderer.mountWorld !== 'function') {
      throw new TypeError('Cinematic renderer must expose mountWorld().');
    }
    renderer = nextRenderer;
    for (const state of mounted.values()) {
      renderer.mountWorld({
        world: state.world,
        tier: state.tier,
        stage: state.stage,
        slots: state.slots,
        budget: getBudget(state.world.id, state.tier)
      });
    }
    return renderer;
  }

  const api = {
    version: '1.1.0-phase-a2.4',
    manifestUrl,
    loadManifest,
    mount,
    unmount,
    registerRenderer,
    getWorld,
    getSlot,
    getBudget,
    chooseSource,
    supportsWebGL2,
    get rendererAttached() { return !!renderer; },
    get ready() { return ready; }
  };

  window.hfCinematic3D = api;
  loadManifest().then(() => {
    const cinematic = window.hfCinematic;
    if (cinematic?.world && cinematic?.backdrop) {
      mount(cinematic.world, { tier: cinematic.tier, backdrop: cinematic.backdrop });
    }
  });
})();
