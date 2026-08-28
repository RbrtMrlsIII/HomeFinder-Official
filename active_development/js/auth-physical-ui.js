/* HomeFinder Auth Physical UI Root - Login/Register propagation */
(() => {
  'use strict';
  const page = document.body?.dataset?.asset === 'surface_register' ? 'register' : 'login';
  const catalogUrl = `data/${page}-physical-ui-objects.json`;
  const root = () => window.hfPhysicalUIState;
  const roots = () => window.hfDesignRoots;
  const motion = () => window.hfAnimationRoot;
  const controllers = new Map();

  const registerAndAttach = (catalog) => {
    catalog?.objects?.forEach((object) => {
      roots?.()?.registerObject?.(object.id, object);
      const nodes = document.querySelectorAll(object.selector);
      nodes.forEach((node) => {
        node.dataset.hfUiObject = object.id;
        node.dataset.hfObjectId = object.id;
        node.dataset.hfObjectRoot = 'ui-object';
        node.dataset.hfAnimationProfile = object.animation;
        node.dataset.hfResponsiveRoot = object.responsive;
        node.classList.add('hf-auth-physical-object');
        const controller = root?.()?.attach?.({node, object, roots: roots?.()});
        if (controller) controllers.set(object.id, controller);
        node.addEventListener('mouseenter', () => controller?.transition('hover'), {passive:true});
        node.addEventListener('mouseleave', () => controller?.transition('unhover'), {passive:true});
        node.addEventListener('focusin', () => controller?.transition('focus'), {passive:true});
        node.addEventListener('focusout', () => controller?.transition('blur'), {passive:true});
        node.addEventListener('click', () => controller?.transition('activate'), {passive:true});
      });
    });

    const form = document.querySelector(page === 'register' ? '#register-form' : '#login-form');
    const submit = document.querySelector(page === 'register' ? '#register-submit' : '#login-submit');
    if (submit && typeof motion?.()?.animate === 'function') {
      submit.addEventListener('click', () => {
        const c = controllers.get(page === 'register' ? 'register-submit-console' : 'login-submit-console');
        c?.transition('activate');
      }, {passive:true});
    }
    if (form) {
      form.addEventListener('submit', () => {
        const c = controllers.get(page === 'register' ? 'register-submit-console' : 'login-submit-console');
        c?.transition('activate');
        c?.transition('loading');
      });
    }
  };

  fetch(catalogUrl, {cache:'no-cache'})
    .then((r) => r.ok ? r.json() : null)
    .then(registerAndAttach)
    .catch(() => {});

  window.hfAuthPhysicalUI = Object.freeze({
    page,
    get: (id) => controllers.get(id) || null,
    transition: (id, event) => controllers.get(id)?.transition(event) || null,
    list: () => Array.from(controllers.keys())
  });
})();
