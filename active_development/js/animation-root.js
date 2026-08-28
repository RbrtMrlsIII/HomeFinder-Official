/* HomeFinder Animation Root
 * One presentation-only motion authority shared by UI objects, cameras,
 * doors, overlays, and environment transitions. It never mutates business state.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const profiles = Object.freeze({
    micro: Object.freeze({duration:'--hf-duration-fast', easing:'--hf-ease-standard'}),
    state: Object.freeze({duration:'--hf-duration-base', easing:'--hf-ease-standard'}),
    emphasis: Object.freeze({duration:'--hf-duration-emphasis', easing:'--hf-ease-emphasis'}),
    cinematic: Object.freeze({duration:'--hf-duration-cinematic', easing:'--hf-ease-emphasis'}),
    door: Object.freeze({duration:'--hf-duration-door', easing:'--hf-ease-emphasis'})
  });

  const isReduced = () => !!reducedQuery?.matches;
  const token = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  const sync = () => {
    root.dataset.hfMotionProfile = isReduced() ? 'reduced' : 'full';
    root.style.setProperty('--hf-motion-enabled', isReduced() ? '0' : '1');
  };
  reducedQuery?.addEventListener?.('change', sync);
  sync();

  const resolve = (profile = 'state') => {
    const selected = profiles[profile] || profiles.state;
    const duration = token(selected.duration) || '220ms';
    const easing = token(selected.easing) || 'cubic-bezier(.22,.61,.36,1)';
    return {profile, duration: isReduced() ? '1ms' : duration, easing};
  };

  const animate = (element, keyframes, options = {}) => {
    if (!element || typeof element.animate !== 'function') return null;
    const profile = resolve(options.profile || 'state');
    const duration = options.duration || profile.duration;
    const easing = options.easing || profile.easing;
    if (isReduced()) {
      element.getAnimations?.().forEach(a => a.cancel());
      return element.animate(keyframes[keyframes.length - 1] || keyframes, {duration:1, fill:'forwards'});
    }
    return element.animate(keyframes, {
      duration: typeof duration === 'string' ? parseFloat(duration) || 220 : duration,
      easing,
      fill: options.fill || 'both',
      ...options
    });
  };

  window.hfAnimationRoot = Object.freeze({
    isReducedMotion: isReduced,
    profiles,
    resolve,
    animate
  });
})();
