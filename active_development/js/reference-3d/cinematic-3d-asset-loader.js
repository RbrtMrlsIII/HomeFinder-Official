/* HomeFinder Cinematic 3D Asset Loader
 * Phase A.2.5: GLB loading, priority scheduling, LOD selection and budgets.
 *
 * Three.js is loaded lazily only when a real GLB source is configured.
 * Until then the native proxy renderer remains the zero-download fallback.
 */
(() => {
  const CDN_BASE = 'https://cdn.jsdelivr.net/npm/three@0.179.1';
  const loaderUrl = `${CDN_BASE}/examples/jsm/loaders/GLTFLoader.js`;
  const ktx2LoaderUrl = `${CDN_BASE}/examples/jsm/loaders/KTX2Loader.js`;
  let ktx2Config = null;
  let threePromise = null;
  const cache = new Map();
  const inflight = new Map();

  const tierRank = { low: 0, medium: 1, high: 2 };
  const normalizeTier = tier => tierRank[tier] >= 0 ? tier : 'medium';

  function chooseLOD(slot, tier, distance = 0) {
    if (!slot) return null;
    const requested = normalizeTier(tier);
    const available = Array.isArray(slot.lod) ? slot.lod : [];
    if (!available.length) return null;
    const distanceTier = distance > 18 ? 'low' : distance > 8 ? 'medium' : 'high';
    const wanted = tierRank[distanceTier] < tierRank[requested] ? distanceTier : requested;
    return available.includes(wanted)
      ? wanted
      : available.slice().sort((a, b) => tierRank[b] - tierRank[a]).find(t => tierRank[t] <= tierRank[wanted]) || available[0];
  }

  function resolveSource(slot, tier, distance = 0) {
    if (!slot?.source) return null;
    const lod = chooseLOD(slot, tier, distance);
    if (!lod) return null;
    if (typeof slot.source === 'string') return { url: slot.source, lod };
    const url = slot.source[lod] || slot.source.high || slot.source.medium || slot.source.low;
    return url ? { url, lod } : null;
  }

  async function loadThree() {
    if (!threePromise) {
      threePromise = Promise.all([
        import(CDN_BASE + '/build/three.module.js'),
        import(loaderUrl),
        import(ktx2LoaderUrl)
      ]).then(([THREE, GLTF, KTX2]) => ({ THREE, GLTFLoader: GLTF.GLTFLoader, KTX2Loader: KTX2.KTX2Loader }));
    }
    return threePromise;
  }

  function configureKTX2({ transcoderPath, renderer } = {}) {
    if (!transcoderPath) throw new TypeError('transcoderPath is required for KTX2 configuration.');
    ktx2Config = { transcoderPath, renderer };
    return ktx2Config;
  }

  async function loadGLB(url, { priority = 'deferred', signal, renderer } = {}) {
    if (!url) throw new Error('A GLB URL is required.');
    if (cache.has(url)) return cache.get(url);
    if (inflight.has(url)) return inflight.get(url);

    const task = loadThree().then(({ GLTFLoader, KTX2Loader }) => new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      const activeRenderer = renderer || ktx2Config?.renderer;
      if (activeRenderer && ktx2Config?.transcoderPath) {
        const ktx2 = new KTX2Loader();
        ktx2.setTranscoderPath(ktx2Config.transcoderPath);
        ktx2.detectSupport(activeRenderer);
        loader.setKTX2Loader(ktx2);
      }
      loader.load(url, resolve, undefined, reject);
      if (signal) {
        if (signal.aborted) loader.manager?.itemError?.(url);
        signal.addEventListener('abort', () => reject(new DOMException('Asset load aborted', 'AbortError')), { once: true });
      }
    })).then(result => {
      cache.set(url, result);
      return result;
    }).finally(() => inflight.delete(url));

    inflight.set(url, task);
    return task;
  }

  function estimateTriangles(root) {
    let triangles = 0;
    root?.traverse?.(node => {
      const geometry = node.geometry;
      if (!geometry) return;
      const index = geometry.index;
      const count = index ? index.count : (geometry.attributes.position?.count || 0);
      triangles += Math.floor(count / 3);
    });
    return triangles;
  }

  function withinBudget(triangles, budget) {
    return !budget?.maxTriangles || triangles <= budget.maxTriangles;
  }

  async function loadSlot({ slot, tier, budget, distance = 0, signal } = {}) {
    const source = resolveSource(slot, tier, distance);
    if (!source) return { loaded: false, reason: 'no-source', fallback: slot?.fallback || null };
    const gltf = await loadGLB(source.url, { priority: slot.priority, signal });
    const triangles = estimateTriangles(gltf.scene);
    if (!withinBudget(triangles, budget)) {
      return { loaded: false, reason: 'triangle-budget', fallback: slot.fallback || null, triangles, lod: source.lod };
    }
    return { loaded: true, lod: source.lod, url: source.url, gltf, triangles };
  }

  function clearCache() {
    cache.clear();
  }

  window.hfCinematicAssetLoader = {
    version: '1.0.0-phase-a2.5',
    chooseLOD,
    resolveSource,
    loadThree,
    configureKTX2,
    loadGLB,
    loadSlot,
    estimateTriangles,
    withinBudget,
    clearCache
  };
})();
