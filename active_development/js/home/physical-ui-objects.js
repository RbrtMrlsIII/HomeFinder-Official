/* A.4.4 Physical UI Object System
 * 3D-facing interaction gateways that hand off to real application UI/routes.
 */
(() => {
  'use strict';
  const hero = document.querySelector('[data-cinematic-focal="hero-residence"]');
  if (!hero) return;
  const objectsUrl = 'data/physical-ui-objects.json';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const stateRoot = () => window.hfPhysicalUIState;
  const designRoots = () => window.hfDesignRoots;
  let catalog = null;

  const mount = () => {
    if (!catalog || hero.querySelector('.hf-physical-object-deck')) return;
    catalog.objects.forEach(o => window.hfDesignRoots?.registerObject(o.id, o));
    const deckObjects = catalog.objects.filter(o => o.renderDeck !== false);
    const deck = document.createElement('div');
    deck.className = 'hf-physical-object-deck';
    deck.setAttribute('aria-label', 'Main Hall feature objects');
    deck.innerHTML = deckObjects.map((o, i) => `
      <button class="hf-physical-object hf-object-${o.kind}" type="button" data-object-id="${o.id}" data-object-action="${o.action}" ${o.href ? `data-object-href="${o.href}"` : ''} ${o.target ? `data-object-target="${o.target}"` : ''} style="--object-index:${i}" aria-label="${o.label}: ${o.description}">
        <span class="hf-object-surface"><i class="bx ${o.icon}" aria-hidden="true"></i></span>
        <span class="hf-object-label"><strong>${o.label}</strong><small>${o.description}</small></span>
      </button>`).join('');
    hero.appendChild(deck);


    const bindState = () => {
      catalog.objects.forEach((object) => {
        const nodes = deck.querySelectorAll(`[data-object-id=\"${CSS.escape(object.id)}\"]`);
        nodes.forEach((node) => { if (!node.__hfPhysicalUIState) stateRoot()?.attach({node, object, roots:designRoots()}); else node.__hfPhysicalUIState.render(node.dataset.hfObjectState || 'idle', 'responsive-sync'); });
      });
    };
    bindState();
    designRoots()?.subscribe?.(() => bindState());

    deck.addEventListener('pointerover', (event) => {
      const node = event.target.closest('.hf-physical-object');
      node?.__hfPhysicalUIState?.transition('hover');
    });
    deck.addEventListener('pointerout', (event) => {
      const node = event.target.closest('.hf-physical-object');
      node?.__hfPhysicalUIState?.transition('unhover');
    });
    deck.addEventListener('focusin', (event) => {
      const node = event.target.closest('.hf-physical-object');
      node?.__hfPhysicalUIState?.transition('focus');
    });
    deck.addEventListener('focusout', (event) => {
      const node = event.target.closest('.hf-physical-object');
      node?.__hfPhysicalUIState?.transition('blur');
    });

    deck.addEventListener('click', (event) => {
      const button = event.target.closest('.hf-physical-object');
      if (!button) return;
      const object = catalog.objects.find(o => o.id === button.dataset.objectId);
      if (!object) return;
      const controller = button.__hfPhysicalUIState || stateRoot()?.attach({node:button, object, roots:designRoots()});
      controller?.transition('activate');
      controller?.transition('open');
      button.classList.add('is-opening');
      window.dispatchEvent(new CustomEvent('hf:physical-object-activate', {detail: object}));
      if (object.action === 'focus' && object.target) {
        const target = document.getElementById(object.target);
        target?.focus?.({preventScroll:true});
      } else if (object.action === 'scroll' && object.target) {
        const target = document.getElementById(object.target);
        target?.scrollIntoView({behavior: reduced?.matches ? 'auto' : 'smooth', block:'center'});
      } else if (object.action === 'navigate' && object.href) {
        setTimeout(() => { window.location.href = object.href; }, reduced?.matches ? 0 : 420);
      } else if (object.action === 'console') {
        deck.classList.toggle('is-console-open');
      }
    });
  };

  fetch(objectsUrl, {cache:'no-store'}).then(r => r.ok ? r.json() : Promise.reject()).then(data => {catalog=data; mount();}).catch(() => {});

  window.hfPhysicalUI = Object.freeze({
    getObject: id => catalog?.objects?.find(o => o.id === id) || null,
    setState: (id, state) => {
      const object = catalog?.objects?.find(o => o.id === id);
      if (!object) return false;
      const node = document.querySelector(`[data-object-id=\"${CSS.escape(id)}\"]`);
      const controller = node ? (node.__hfPhysicalUIState || stateRoot()?.attach({node, object, roots:designRoots()})) : null;
      if (controller) controller.render(state, 'external');
      else if (node) node.dataset.hfObjectState = state;
      return true;
    }
  });
})();
