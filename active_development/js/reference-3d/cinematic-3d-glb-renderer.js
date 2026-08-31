/* HomeFinder GLB renderer for P04. Uses the existing Three.js asset loader and target manifest. */
(() => {
  const api = window.hfCinematic3D;
  const loader = window.hfCinematicAssetLoader;
  if (!api || !loader || api.__glbRendererRegistered) return;

  let state = null;
  const clearStage = (stage) => { if (stage) stage.replaceChildren(); };
  const setAttrs = (stage, targetId, target, extra = {}) => {
    if (!stage) return;
    stage.dataset.renderer = 'three-glb';
    stage.dataset.targetId = targetId || '';
    stage.dataset.modelScale = String(target?.modelScale ?? 0.01);
    stage.dataset.coordinateConvention = target?.coordinateConvention || 'source-cm-to-m-xzy';
    if (target?.glbUrl) stage.dataset.glbUrl = target.glbUrl;
    Object.entries(extra).forEach(([k,v]) => { stage.dataset[k] = String(v); });
    const cam = target?.cameraThreeMeters;
    if (cam?.position && cam?.target) {
      stage.dataset.cameraPosition = cam.position.join(',');
      stage.dataset.cameraTarget = cam.target.join(',');
      stage.dataset.cameraFov = String(cam.fov);
    }
  };

  async function mountWorld({ stage, targetId, target, tier = 'medium' }) {
    if (state?.stage === stage && state?.targetId === targetId) return;
    if (state) await renderer.unmountWorld(state);
    const canvas = document.createElement('canvas');
    canvas.className = 'hf-cinematic-3d-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    stage.replaceChildren(canvas);
    const { THREE, GLTFLoader } = await loader.loadThree();
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true });
    if (!gl) throw new Error('WebGL2 context unavailable');
    const webgl = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true });
    webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    webgl.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.background = null;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6f7f8f, 1.35));
    const light = new THREE.DirectionalLight(0xffffff, 1.6); light.position.set(6, 10, 8); scene.add(light);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 200);
    state = { stage, canvas, webgl, scene, camera, targetId, target, model: null, raf: 0 };
    setAttrs(stage, targetId, target, { glbLoaded: 'false' });

    const resize = () => {
      if (!state) return;
      const r = stage.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      webgl.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const onResize = () => resize(); window.addEventListener('resize', onResize);
    state.onResize = onResize;
    resize();

    const cam = target?.cameraThreeMeters;
    if (cam?.position && cam?.target) {
      camera.position.fromArray(cam.position);
      camera.lookAt(...cam.target);
      if (Number.isFinite(cam.fov)) camera.fov = Number(cam.fov);
      camera.updateProjectionMatrix();
    }

    if (!target?.glbUrl) throw new Error(`No GLB URL declared for ${targetId}`);
    const loaded = await loader.loadGLB(target.glbUrl);
    const root = loaded.scene;
    const modelScale = Number(target?.modelScale ?? 0.01);
    root.scale.setScalar(modelScale);
    root.rotation.x = -Math.PI / 2;
    scene.add(root);
    state.model = root;
    setAttrs(stage, targetId, target, {
      glbLoaded: 'true',
      glbTriangles: loader.estimateTriangles(root)
    });

    const frame = () => {
      if (!state) return;
      resize();
      webgl.render(scene, camera);
      state.raf = requestAnimationFrame(frame);
    };
    frame();
  }

  async function setTarget({ targetId, target } = {}) {
    if (!state) return { changed: false, reason: 'not-mounted', targetId };
    if (!target) return { changed: false, reason: 'missing-target', targetId };
    const previous = state.targetId;
    if (previous === targetId) return { changed: true, targetId, target };
    const next = { ...state, targetId, target, model: null };
    if (state.model) state.scene.remove(state.model);
    setAttrs(state.stage, targetId, target, { glbLoaded: 'false' });
    state.targetId = targetId; state.target = target;
    const cam = target.cameraThreeMeters;
    if (cam?.position && cam?.target) {
      state.camera.position.fromArray(cam.position);
      state.camera.lookAt(...cam.target);
      state.camera.fov = Number(cam.fov || 60);
      state.camera.updateProjectionMatrix();
    }
    if (!target.glbUrl) throw new Error(`No GLB URL declared for ${targetId}`);
    const loaded = await loader.loadGLB(target.glbUrl);
    const root = loaded.scene;
    root.scale.setScalar(Number(target.modelScale ?? 0.01));
    root.rotation.x = -Math.PI / 2;
    state.scene.add(root); state.model = root;
    setAttrs(state.stage, targetId, target, { glbLoaded: 'true', glbTriangles: loader.estimateTriangles(root) });
    return { changed: true, targetId, target };
  }

  const renderer = {
    mountWorld,
    setTarget,
    async unmountWorld(s) {
      if (!s) return;
      if (s.raf) cancelAnimationFrame(s.raf);
      window.removeEventListener('resize', s.onResize);
      s.model?.removeFromParent();
      s.webgl?.dispose?.();
      clearStage(s.stage);
      if (state === s) state = null;
    }
  };
  api.__glbRendererRegistered = true;
  api.registerRenderer(renderer);
})();
