/* A.4.2 House Camera Rig
 * Converts the WalkMyPlan-derived architectural camera anchors into a shared
 * runtime contract consumed by the scroll choreography and WebGL renderer.
 */
(() => {
  'use strict';
  const RIG_URL = 'data/house-camera-rig.json';
  const fallback = {
    version: 1,
    anchors: {
      arrival:{position:[0,1.65,8.6],target:[0,1.55,1.8],fov:48},
      hall:{position:[0,1.68,4.4],target:[0,1.55,-1.4],fov:52},
      center:{position:[0,1.72,0.2],target:[0,1.5,-4],fov:52}
    },
    sectionMap:{hero:'hall',about:'center',map:'window',properties:'living'}
  };
  let rig = null;
  let state = { anchor:'arrival', position:[0,1.65,8.6], target:[0,1.55,1.8], fov:48, progress:0 };

  const clone = value => Array.isArray(value) ? value.slice() : value;
  const emit = () => window.dispatchEvent(new CustomEvent('hf:house-camera-update', { detail: {...state} }));

  function setState(next) {
    state = {
      anchor: next.anchor || state.anchor,
      position: clone(next.position || state.position),
      target: clone(next.target || state.target),
      fov: Number.isFinite(next.fov) ? next.fov : state.fov,
      progress: Number.isFinite(next.progress) ? next.progress : state.progress
    };
    window.__HF_HOUSE_CAMERA__ = {...state};
    emit();
  }

  async function load() {
    try {
      const res = await fetch(RIG_URL, {cache:'no-store'});
      if (!res.ok) throw new Error(`camera rig ${res.status}`);
      rig = await res.json();
    } catch (_) {
      rig = fallback;
    }
    window.__HF_HOUSE_CAMERA_RIG__ = rig;
    window.dispatchEvent(new CustomEvent('hf:house-camera-rig-ready', {detail: rig}));
    emit();
    return rig;
  }

  window.hfHouseCamera = {
    version:'1.0.0-phase-a4.2',
    get rig(){ return rig; },
    get state(){ return {...state, position:clone(state.position), target:clone(state.target)}; },
    getAnchor(id){ return rig?.anchors?.[id] || null; },
    getAnchorForSection(zone){
      const id = zone?.dataset?.cameraAnchor || rig?.sectionMap?.[zone?.dataset?.houseZone];
      return id ? rig?.anchors?.[id] || null : null;
    },
    setState,
    setAnchor(id, progress=0){
      const anchor = rig?.anchors?.[id];
      if (!anchor) return false;
      setState({anchor:id, position:anchor.position, target:anchor.target, fov:anchor.fov, progress});
      return true;
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, {once:true});
  else load();
})();
