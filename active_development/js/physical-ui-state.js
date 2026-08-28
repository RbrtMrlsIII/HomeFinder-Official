/* HomeFinder Physical UI Object State Machine + Responsive Transformer
 * Presentation-only. Business/auth authority remains elsewhere.
 */
(() => {
  'use strict';
  const STATES = Object.freeze(['idle','hover','focus','interaction-start','ui-open','loading','success','error','empty','disabled']);
  const EVENTS = Object.freeze({
    HOVER:'hover', UNHOVER:'unhover', FOCUS:'focus', BLUR:'blur', ACTIVATE:'activate', OPEN:'open',
    LOADING:'loading', SUCCESS:'success', ERROR:'error', EMPTY:'empty', DISABLE:'disable', ENABLE:'enable', RESET:'reset'
  });
  const TRANSITIONS = Object.freeze({
    idle: Object.freeze({hover:'hover',focus:'focus',activate:'interaction-start',disable:'disabled'}),
    hover: Object.freeze({unhover:'idle',focus:'focus',activate:'interaction-start',disable:'disabled'}),
    focus: Object.freeze({blur:'idle',activate:'interaction-start',hover:'hover',disable:'disabled'}),
    'interaction-start': Object.freeze({open:'ui-open',loading:'loading',success:'success',error:'error',empty:'empty',disable:'disabled',reset:'idle'}),
    'ui-open': Object.freeze({loading:'loading',success:'success',error:'error',empty:'empty',disable:'disabled',reset:'idle'}),
    loading: Object.freeze({success:'success',error:'error',empty:'empty',disable:'disabled',reset:'idle'}),
    success: Object.freeze({activate:'interaction-start',reset:'idle',disable:'disabled'}),
    error: Object.freeze({activate:'interaction-start',reset:'idle',disable:'disabled'}),
    empty: Object.freeze({activate:'interaction-start',reset:'idle',disable:'disabled'}),
    disabled: Object.freeze({enable:'idle'})
  });

  const stateFor = (current, event) => TRANSITIONS[current]?.[event] || current;
  const normalize = (value) => STATES.includes(value) ? value : 'idle';

  const applyResponsive = (node, object, viewport) => {
    if (!node || !viewport) return;
    const mode = viewport.smallest < 480 ? (viewport.width >= viewport.height ? 'mobile-landscape' : 'mobile-portrait') : viewport.width < 768 ? 'compact' : viewport.width < 1200 ? 'tablet' : viewport.width < 1600 ? 'desktop' : 'wide-desktop';
    node.dataset.hfResponsiveMode = mode;
    node.style.setProperty('--hf-object-density', String(viewport.density ?? 1));
    node.style.setProperty('--hf-object-ui-scale', String(viewport.uiScale ?? 1));
    node.style.setProperty('--hf-object-responsive', object?.responsive || 'root');
  };

  const attach = ({node, object, roots}) => {
    if (!node || !object) return null;
    let state = normalize(node.dataset.hfObjectState);
    const getViewport = () => roots?.viewport?.() || {width:window.innerWidth||1024,height:window.innerHeight||768,density:1,uiScale:1,smallest:Math.min(window.innerWidth||1024,window.innerHeight||768)};
    const render = (next, reason) => {
      state = normalize(next);
      node.dataset.hfObjectState = state;
      node.dataset.hfObjectMotion = roots?.isReducedMotion?.() ? 'instant' : 'standard';
      node.classList.toggle('is-active', ['hover','focus','interaction-start','ui-open','loading','success'].includes(state));
      node.classList.toggle('is-busy', state === 'loading');
      node.classList.toggle('is-disabled', state === 'disabled');
      node.setAttribute('aria-busy', String(state === 'loading'));
      applyResponsive(node, object, getViewport());
      window.dispatchEvent(new CustomEvent('hf:physical-object-state', {detail:{id:object.id, state, object, reason, responsive:node.dataset.hfResponsiveMode}}));
      return state;
    };
    const transition = (event) => {
      const next = stateFor(state, event);
      return render(next, event);
    };
    node.__hfPhysicalUIState = Object.freeze({get:()=>state, transition, render});
    render(state, 'mount');
    return node.__hfPhysicalUIState;
  };

  window.hfPhysicalUIState = Object.freeze({STATES, EVENTS, TRANSITIONS, stateFor, attach, applyResponsive});
})();
