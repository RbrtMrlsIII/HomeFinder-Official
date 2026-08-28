/* HomeFinder Design Roots Runtime
 * Single runtime owner for environment-aware UI root state, motion state,
 * responsive density, and camera transition defaults. No business authority.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const state = {
    reduced: false,
    width: window.innerWidth || 1024,
    height: window.innerHeight || 768,
    smallest: Math.min(window.innerWidth || 1024, window.innerHeight || 768),
    density: 1,
    uiScale: 1
  };

  const sync = () => {
    state.width = window.innerWidth || state.width;
    state.height = window.innerHeight || state.height;
    state.smallest = Math.min(state.width, state.height);
    state.reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const smallest = Math.min(state.width, state.height);
    if (smallest < 480) {
      state.density = .88; state.uiScale = .92;
    } else if (smallest < 768) {
      state.density = .94; state.uiScale = .96;
    } else {
      state.density = 1; state.uiScale = 1;
    }
    root.dataset.hfMotion = state.reduced ? 'reduced' : 'full';
    root.dataset.hfViewport = state.width < 768 ? 'compact' : (state.width < 1200 ? 'standard' : 'wide');
    root.style.setProperty('--hf-density', state.density);
    root.style.setProperty('--hf-ui-scale', state.uiScale);
    root.style.setProperty('--hf-viewport-smallest', `${state.smallest}px`);
    subscribers.forEach(fn => { try { fn({...state}); } catch (_) {} });
  };

  const objectRegistry = new Map();
  const subscribers = new Set();
  const onMotionChange = () => sync();
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  mq?.addEventListener?.('change', onMotionChange);
  window.addEventListener('resize', sync, { passive: true });
  sync();

  window.hfDesignRoots = Object.freeze({
    getState: () => ({ ...state }),
    isReducedMotion: () => state.reduced,
    viewport: () => ({ width: state.width, height: state.height, smallest: state.smallest, density: state.density, uiScale: state.uiScale }),
    subscribe: (fn) => { if (typeof fn !== 'function') return () => {}; subscribers.add(fn); return () => subscribers.delete(fn); },
    setEnvironment: (id) => {
      if (typeof id !== 'string' || !id) return false;
      root.dataset.environment = id;
      return true;
    },
    registerObject: (id, definition) => {
      if (typeof id !== 'string' || !id || !definition || typeof definition !== 'object') return false;
      objectRegistry.set(id, Object.freeze({...definition}));
      return true;
    },
    getObject: (id) => objectRegistry.get(id) || null,
    listObjects: () => Array.from(objectRegistry.values())
  });
})();
