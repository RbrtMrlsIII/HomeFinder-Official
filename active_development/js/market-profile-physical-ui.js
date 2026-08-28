/* HomeFinder Market/Profile physical UI propagation.
 * Registers semantic objects with the shared design roots and state machine.
 * Presentation-only: auth/data authority remains in page-specific controllers.
 */
(() => {
  'use strict';
  const boot = () => {
    const roots = window.hfDesignRoots;
    const stateApi = window.hfPhysicalUIState;
    if (!roots || !stateApi) return;

    const page = document.body?.classList.contains('market-page') ? 'market' : document.body?.classList.contains('profile-page') ? 'profile' : null;
    if (!page) return;
    const manifestUrl = page === 'market' ? 'data/market-physical-ui-objects.json' : 'data/profile-physical-ui-objects.json';

    fetch(manifestUrl, {cache:'no-store'})
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`manifest ${r.status}`)))
      .then(manifest => {
        for (const object of manifest.objects || []) {
          roots.registerObject(object.id, object);
          document.querySelectorAll(object.selector).forEach(node => {
            node.dataset.hfPhysicalObjectId = object.id;
            node.dataset.hfPov = object.pov;
            node.dataset.hfAnimationProfile = object.animation || 'state';
            node.dataset.hfResponsiveRoot = object.responsive || 'root';
            node.dataset.hfThemeRoot = 'environment';
            stateApi.attach({node, object, roots});
          });
        }
        document.documentElement.dataset.hfPagePhysicalUi = page;
        window.dispatchEvent(new CustomEvent('hf:page-physical-ui-ready', {detail:{page, count:manifest.objects?.length || 0}}));
      })
      .catch(error => {
        document.documentElement.dataset.hfPagePhysicalUi = 'fallback';
        window.dispatchEvent(new CustomEvent('hf:page-physical-ui-error', {detail:{page, error}}));
      });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
