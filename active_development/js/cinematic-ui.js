/* HomeFinder Cinematic UI System
 * Shared page-entry/exit choreography + lightweight ambient depth scene.
 * This is deliberately asset-optional: real WebM/GLB hero media can be mounted
 * later without changing page ownership or business logic.
 */
(() => {
  const path = location.pathname.toLowerCase();
  const file = path.split('/').pop() || 'index.html';
  const pageKey = /verify\//.test(path) ? 'verify' : file.replace(/\.html$/, '') || 'index';
  const sceneKey = ({
    index:'home', market:'market', profile:'profile', 'broker-hq':'broker',
    admin:'admin', staff:'staff', moderator:'moderator', login:'auth', register:'auth',
    verify:'auth', financing:'financing', privacy:'legal', terms:'legal'
  })[pageKey] || 'legal';

  const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const tier = reduced ? 'reduced' : (cores >= 8 && memory >= 8 && !small ? 'high' : (cores >= 4 && memory >= 4 ? 'medium' : 'low'));

  document.documentElement.classList.add('hf-cinematic-enter');
  document.body?.classList.add(`hf-scene-${sceneKey}`, `hf-cinematic-${tier}`);

  const backdrop = document.createElement('div');
  backdrop.className = 'hf-cinematic-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');

  const canvas = document.createElement('canvas');
  canvas.className = 'hf-cinematic-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  backdrop.appendChild(canvas);

  // Optional future hero loop. Missing assets are normal in the current repository.
  const video = document.createElement('video');
  video.className = 'hf-cinematic-video';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = tier === 'high' ? 'metadata' : 'none';
  video.setAttribute('aria-hidden','true');
  const sceneCatalog = window.__HF_CINEMATIC_SCENES__ || { scenes: { home: { media: 'assets/cinematic/home.webm', hero: 'hyper-realistic premium coastal residential city / World 01', world: 'world-01-home' } } };
  const scene = sceneCatalog?.scenes?.[sceneKey] || {};
  const src = scene.media || (sceneKey === 'home' ? 'assets/cinematic/home.webm' : `assets/cinematic/${sceneKey}.webm`);
  if (scene.poster) backdrop.style.setProperty('--hf-cinematic-poster', `url("${scene.poster}")`);
  // Do not initiate heavyweight media on reduced/low tiers. The procedural
  // scene remains the intentional fallback until a real hero asset exists.
  if (!reduced && tier !== 'low') video.src = src;
  video.addEventListener('loadeddata', () => { backdrop.classList.add('has-video'); video.play().catch(()=>{}); }, { once:true });
  video.addEventListener('error', () => { backdrop.classList.remove('has-video'); }, { once:true });
  backdrop.appendChild(video);
  if (scene.poster) backdrop.classList.add('has-poster');

  // Phase A.2.1: Home hero is a layered cinematic prototype. Each layer is
  // deliberately replaceable by future optimized WalkMyPlan/WebGL assets without changing
  // routing, navigation, or page ownership.
  if (sceneKey === 'home') {
    const worldLayers = document.createElement('div');
    worldLayers.className = 'hf-home-world-layers';
    worldLayers.setAttribute('aria-hidden', 'true');
    worldLayers.innerHTML = `
      <div class="hf-home-layer hf-home-sky"></div>
      <div class="hf-home-layer hf-home-skyline"></div>
      <div class="hf-home-layer hf-home-residence"></div>
      <div class="hf-home-layer hf-home-foreground"></div>
      <div class="hf-home-layer hf-home-haze"></div>
      <div class="hf-home-layer hf-home-sun"></div>`;
    backdrop.appendChild(worldLayers);
    backdrop.classList.add('has-home-layers');

    const pointerEnabled = !reduced && tier !== 'low' && window.matchMedia?.('(pointer:fine)').matches;
    let px = 0, py = 0, tx = 0, ty = 0;
    const onPointer = (e) => {
      if (!pointerEnabled || document.visibilityState !== 'visible') return;
      tx = (e.clientX / Math.max(1, window.innerWidth) - .5) * 2;
      ty = (e.clientY / Math.max(1, window.innerHeight) - .5) * 2;
    };
    const resetPointer = () => { tx = 0; ty = 0; };
    if (pointerEnabled) {
      window.addEventListener('pointermove', onPointer, {passive:true});
      window.addEventListener('blur', resetPointer, {passive:true});
    }
    const animateLayers = (t) => {
      if (!backdrop.isConnected || reduced) return;
      px += (tx - px) * .035;
      py += (ty - py) * .035;
      const slowX = Math.sin(t * .000055) * .55;
      const slowY = Math.cos(t * .000043) * .35;
      worldLayers.style.setProperty('--hf-home-px', `${(px * 8 + slowX).toFixed(2)}px`);
      worldLayers.style.setProperty('--hf-home-py', `${(py * 5 + slowY).toFixed(2)}px`);

      // Phase A.2.2: one low-cost cinematic camera rig drives the whole Home world.
      // It loops smoothly and uses pointer input only as a tiny additive offset.
      const phase = ((t % HOME_LOOP_MS) / HOME_LOOP_MS) * Math.PI * 2;
      const cameraX = Math.sin(phase) * HOME_CAMERA_MAX_X + px * 0.22;
      const cameraY = Math.sin(phase * 0.82 + 0.55) * HOME_CAMERA_MAX_Y + py * 0.12;
      const cameraScale = 1.025 + (0.008 * (0.5 + 0.5 * Math.sin(phase - 0.6)));
      backdrop.style.setProperty('--hf-camera-x', `${cameraX.toFixed(3)}%`);
      backdrop.style.setProperty('--hf-camera-y', `${cameraY.toFixed(3)}%`);
      backdrop.style.setProperty('--hf-camera-scale', cameraScale.toFixed(4));

      const hero = document.querySelector('[data-cinematic-anchor="hero"]');
      if (hero) {
        hero.style.setProperty('--hf-hero-drift-x', `${(cameraX * -0.10).toFixed(3)}px`);
        hero.style.setProperty('--hf-hero-drift-y', `${(cameraY * -0.08).toFixed(3)}px`);
      }
      requestAnimationFrame(animateLayers);
    };
    if (!reduced) requestAnimationFrame(animateLayers);
  }

  const vignette = document.createElement('div');
  vignette.className = 'hf-cinematic-vignette';
  backdrop.appendChild(vignette);
  document.body.prepend(backdrop);

  // Mark an existing hero/top surface without changing page ownership.
  const explicitHero = document.querySelector('[data-asset*="hero"], .hero, .profile-summary, .bhq-hero, main > section:first-child, main > .page-content:first-child');
  if (explicitHero) explicitHero.classList.add('hf-cinematic-hero-target');

  let w = 0, h = 0, dpr = 1, raf = 0, particles = [];
  let visible = document.visibilityState === 'visible';
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    const cap = tier === 'high' ? 1.5 : tier === 'medium' ? 1.2 : .9;
    dpr = Math.min(window.devicePixelRatio || 1, cap);
    canvas.width = Math.max(1, Math.floor(w*dpr));
    canvas.height = Math.max(1, Math.floor(h*dpr));
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    const count = tier === 'high' ? 90 : tier === 'medium' ? 56 : tier === 'low' ? 28 : 0;
    particles = Array.from({length:count}, (_,i) => ({
      x: Math.random()*w, y: Math.random()*h, z:.2 + Math.random()*.8,
      r:.4 + Math.random()*1.8, phase:Math.random()*Math.PI*2,
      speed:.08 + Math.random()*.2, drift:(Math.random()-.5)*.18,
      i
    }));
  }
  function draw(t) {
    if (!ctx || reduced || !visible) { raf = 0; return; }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,h,0,0);
    g.addColorStop(0,'rgba(255,255,255,.015)');
    g.addColorStop(.55,'rgba(255,255,255,.028)');
    g.addColorStop(1,'rgba(255,255,255,.002)');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);

    for (const p of particles) {
      const tt=t*.001*p.speed;
      const px = p.x + Math.sin(tt+p.phase)*24*p.z + p.drift*t*.02;
      const py = p.y + Math.cos(tt*.8+p.phase)*14*p.z;
      const alpha = .03 + .11*p.z;
      const r = p.r*(.5+p.z);
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fillStyle=`rgba(238,221,190,${alpha})`; ctx.fill();
    }
    // One slow horizon beam creates depth without per-frame heavy geometry.
    const y = h*.63 + Math.sin(t*.00011)*h*.045;
    const beam = ctx.createLinearGradient(0,y-80,0,y+80);
    beam.addColorStop(0,'rgba(232,209,171,0)');
    beam.addColorStop(.5,'rgba(232,209,171,.055)');
    beam.addColorStop(1,'rgba(232,209,171,0)');
    ctx.fillStyle=beam; ctx.fillRect(0,y-90,w,180);
    raf=requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize, {passive:true});
  function startAmbient() {
    if (!reduced && visible && !raf) raf = requestAnimationFrame(draw);
  }
  function stopAmbient() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (visible) {
      video.play().catch(()=>{});
      startAmbient();
    } else {
      stopAmbient();
      video.pause();
    }
  });
  startAmbient();

  let pendingHref = null, confirmEl = null, entryOpened = false, lastFocused = null;
  const DOOR_OPEN_MS = reduced ? 0 : 1040;
  const DOOR_EXIT_MS = reduced ? 0 : 760;
  const DOOR_WORLD_REVEAL_MS = reduced ? 0 : 720;
  const HOME_LOOP_MS = 22000;
  const HOME_CAMERA_MAX_X = 0.75;
  const HOME_CAMERA_MAX_Y = 0.32;

  function createDoor() {
    const root = document.createElement('div');
    root.className='hf-door-transition';
    root.setAttribute('aria-hidden','true');
    root.innerHTML=`<div class="hf-door-stage"><div class="hf-door-atmosphere"></div><div class="hf-door-light"></div><div class="hf-door-frame"><div class="hf-door hf-door-left"><span class="hf-door-handle"></span></div><div class="hf-door hf-door-right"><span class="hf-door-handle"></span></div></div><div class="hf-door-copy"><span class="hf-door-kicker">HomeFinder</span><span class="hf-door-status">Entering</span></div></div>`;
    document.body.appendChild(root);
    return root;
  }

  const releaseEntry = () => {
    if (entryOpened) return;
    entryOpened = true;
    if (reduced) {
      door.classList.add('is-hidden');
      document.documentElement.classList.remove('hf-cinematic-enter');
      return;
    }
    requestAnimationFrame(() => {
      door.classList.add('is-opening');
      window.setTimeout(() => {
        document.documentElement.classList.remove('hf-cinematic-enter');
        window.dispatchEvent(new CustomEvent('hf:cinematic-enter-complete', { detail: { page: pageKey, scene: sceneKey, worldRevealMs: DOOR_WORLD_REVEAL_MS } }));
      }, DOOR_WORLD_REVEAL_MS);
      window.setTimeout(() => {
        door.classList.add('is-hidden');
      }, DOOR_OPEN_MS);
    });
  };

  window.addEventListener('load', releaseEntry, { once:true });
  setTimeout(releaseEntry, 2600);

  function closeExitConfirm() {
    if (!confirmEl) return;
    confirmEl.remove();
    confirmEl = null;
    if (lastFocused && document.contains(lastFocused)) {
      try { lastFocused.focus({preventScroll:true}); } catch (_) { try { lastFocused.focus(); } catch (_) {} }
    }
    lastFocused = null;
  }

  function confirmExit(href, dirty = false) {
    if (reduced) return Promise.resolve(true);
    return new Promise(resolve => {
      closeExitConfirm();
      lastFocused = document.activeElement;
      confirmEl = document.createElement('div');
      confirmEl.className='hf-exit-confirm';
      confirmEl.setAttribute('role','dialog');
      confirmEl.setAttribute('aria-modal','true');
      confirmEl.setAttribute('aria-labelledby','hf-exit-title');
      confirmEl.innerHTML=`<div class="hf-exit-copy"><strong id="hf-exit-title">${dirty ? 'Leave with unsaved changes?' : 'Leave this space?'}</strong><span>${dirty ? 'Your unsaved changes may be lost.' : 'The door will close before you enter the next space.'}</span></div><div class="hf-exit-actions"><button type="button" data-cancel>Stay</button><button type="button" class="primary" data-leave>Leave</button></div>`;
      document.body.appendChild(confirmEl);

      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        confirmEl?.remove();
        confirmEl=null;
        const focusTarget = lastFocused;
        lastFocused=null;
        if (!ok && focusTarget && document.contains(focusTarget)) {
          try { focusTarget.focus({preventScroll:true}); } catch (_) { try { focusTarget.focus(); } catch (_) {} }
        }
        resolve(ok);
      };
      confirmEl.querySelector('[data-cancel]')?.addEventListener('click',()=>finish(false),{once:true});
      confirmEl.querySelector('[data-leave]')?.addEventListener('click',()=>finish(true),{once:true});
      confirmEl.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); finish(false); return; }
        if (e.key !== 'Tab') return;
        const buttons = [...confirmEl.querySelectorAll('button:not([disabled])')];
        if (!buttons.length) return;
        const first = buttons[0], last = buttons[buttons.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      requestAnimationFrame(() => confirmEl?.querySelector('[data-cancel]')?.focus());
    });
  }

  async function navigate(href, skipConfirm=false) {
    if (pendingHref || !href) return;
    pendingHref = href;
    try {
      let ok = true;
      if (!skipConfirm) {
        const guard = leaveGuard();
        const dirty = !!guard?.isDirty?.();
        ok = await confirmExit(href, dirty);
        if (ok && dirty) guard?.clearDirty?.();
      }
      if (!ok) return;

      door = door || createDoor();
      door.setAttribute('aria-hidden','false');
      door.querySelector('.hf-door-status')?.replaceChildren(document.createTextNode('Leaving'));
      window.dispatchEvent(new CustomEvent('hf:cinematic-exit-start', { detail: { href, page: pageKey, scene: sceneKey, durationMs: DOOR_EXIT_MS } }));
      door.classList.remove('is-hidden','is-opening','is-closed');
      requestAnimationFrame(() => {
        door.classList.add('is-closing');
        document.documentElement.classList.add('hf-cinematic-exiting');
      });
      await new Promise(r => setTimeout(r, DOOR_EXIT_MS));
      location.assign(href);
    } finally {
      setTimeout(() => { pendingHref=null; }, DOOR_EXIT_MS + 100);
    }
  }

  window.hfCinematic = {
    navigate, pageKey, sceneKey, tier, backdrop,
    version: '1.5.0-world-a2.4',
    world: scene.world || null,
    performance: { reduced, cores, memory },
    timings: { open: DOOR_OPEN_MS, exit: DOOR_EXIT_MS, worldReveal: DOOR_WORLD_REVEAL_MS, homeLoop: HOME_LOOP_MS },
    camera: { mode: sceneKey === 'home' ? 'cinematic-orbit' : 'ambient', loopMs: HOME_LOOP_MS },
  };
  window.dispatchEvent(new CustomEvent('hf:cinematic-ready', { detail: window.hfCinematic }));
  // Phase A.2.3: let the renderer-neutral asset adapter mount the current world.
  window.hfCinematic3D?.mount?.(scene.world || `world-${sceneKey}`, { tier, backdrop });

  document.addEventListener('click', (e) => {
    const a=e.target?.closest?.('a[href]');
    if(!a) return;
    const href=a.getAttribute('href')||'';
    if(!href || a.target==='_blank' || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    if(a.hasAttribute('data-no-transition') || a.hasAttribute('data-cinematic-safe')) return;
    let u; try{u=new URL(href,location.href);}catch(_){return;}
    if(u.origin!==location.origin) return;
    if(u.pathname===location.pathname && u.search===location.search && u.hash===location.hash) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const skipConfirm = a.hasAttribute('data-no-leave-confirm') || a.hasAttribute('data-leave-safe');
    navigate(u.href, skipConfirm);
  }, true);

  // Expose an upgrade path for existing code that calls window.goTo.
  const priorGoTo = window.goTo;
  window.goTo = (href) => navigate(href, false).catch(()=>priorGoTo?.(href));
})();
