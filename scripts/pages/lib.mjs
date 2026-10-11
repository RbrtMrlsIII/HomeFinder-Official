// Shared helpers for the GitHub Pages artifact checks. No dependencies.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, normalize, extname, resolve, sep } from 'node:path';

export const REQUIRED_FILES = [
  'index.html',
  '404.html',
  'active_development/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html',
  'master/HomeFinder.sh3d'
];
export const LANDING_MARKERS = ['GitHub Pages', 'Vercel is not a production'];
const MAX_SITE_BYTES = 900 * 1024 * 1024; // GitHub Pages sites are limited to 1 GB.
const VIEWER_PATH = REQUIRED_FILES[2];

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(full) : statSync(full).size;
  }
  return total;
}

function refsOf(html) {
  const refs = [];
  const attr = /\b(?:href|src|action|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const m of html.matchAll(attr)) refs.push(m[1] ?? m[2]);
  const css = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi;
  for (const m of html.matchAll(css)) refs.push(m[1] ?? m[2] ?? m[3]);
  return refs.filter(Boolean);
}

/** Static checks on the assembled Pages artifact (the dist directory). */
export function verifyDist(dist) {
  const root = resolve(dist);
  const problems = [];
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(root, file))) problems.push(`missing required file: ${file}`);
  }
  const indexPath = join(root, 'index.html');
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf8');
    for (const marker of LANDING_MARKERS) {
      if (!html.includes(marker)) problems.push(`index.html is missing the marker "${marker}"`);
    }
    if (/http-equiv\s*=\s*["']?refresh/i.test(html)) problems.push('index.html must not auto-redirect the public live site');
  }
  for (const page of ['index.html', '404.html']) {
    const pagePath = join(root, page);
    if (!existsSync(pagePath)) continue;
    for (const raw of refsOf(readFileSync(pagePath, 'utf8'))) {
      const ref = raw.trim();
      if (ref === '' || ref.startsWith('#') || /^(mailto:|tel:|data:|javascript:)/i.test(ref)) continue;
      if (/^https?:\/\//i.test(ref) || ref.startsWith('//')) {
        if (/vercel\.app/i.test(ref)) problems.push(`${page}: links to a Vercel host: ${ref}`);
        continue;
      }
      if (ref.startsWith('/')) {
        problems.push(`${page}: root-absolute reference breaks under /HomeFinder-Official/: ${ref}`);
        continue;
      }
      const target = normalize(join(root, ref.split('#')[0].split('?')[0]));
      if (target !== root && !target.startsWith(root + sep)) {
        problems.push(`${page}: reference escapes the site: ${ref}`);
        continue;
      }
      const found = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
      if (!found) problems.push(`${page}: broken relative reference: ${ref}`);
    }
  }
  const bytes = existsSync(root) ? dirSize(root) : 0;
  if (bytes > MAX_SITE_BYTES) problems.push(`site is ${bytes} bytes; GitHub Pages allows 1 GB`);
  return { ok: problems.length === 0, problems, notes: [`site size: ${(bytes / 1024 / 1024).toFixed(1)} MB`] };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** HTTP probe of a deployed (or locally served) site. baseUrl must include the project path. */
export async function probe(baseUrl, { attempts = 10, delayMs = 6000, fetchImpl = fetch } = {}) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const get = async (path) => {
    const res = await fetchImpl(base + path, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
    const bytes = Buffer.from(await res.arrayBuffer());
    return { status: res.status, type: res.headers.get('content-type') || '', bytes: bytes.length, text: bytes.toString('utf8') };
  };
  const isRevival = (r) => r.status === 200 && LANDING_MARKERS.every((m) => r.text.includes(m));

  let landing = { status: 0, type: '', bytes: 0, text: '' };
  for (let i = 1; i <= attempts; i += 1) {
    try { landing = await get(''); } catch (error) { landing = { status: 0, type: '', bytes: 0, text: String(error) }; }
    if (isRevival(landing)) break;
    if (i < attempts) await sleep(delayMs);
  }
  const viewer = await get(VIEWER_PATH).catch(() => ({ status: 0, type: '', bytes: 0, text: '' }));
  const missing = await get('__homefinder_probe_404__').catch(() => ({ status: 0, type: '', bytes: 0, text: '' }));
  const model = await get('master/HomeFinder.sh3d').catch(() => ({ status: 0, type: '', bytes: 0, text: '' }));

  const results = [
    { name: 'landing returns HTTP 200', ok: landing.status === 200, detail: `HTTP ${landing.status}` },
    { name: 'landing is HTML', ok: /text\/html/i.test(landing.type), detail: landing.type },
    { name: 'landing is the revival page', ok: isRevival(landing), detail: LANDING_MARKERS.filter((m) => !landing.text.includes(m)).map((m) => `missing "${m}"`).join('; ') || 'markers present' },
    { name: 'landing does not auto-redirect', ok: !/http-equiv\s*=\s*["']?refresh/i.test(landing.text), detail: '' },
    { name: '3D viewer page returns HTTP 200', ok: viewer.status === 200, detail: `HTTP ${viewer.status}` },
    { name: 'unknown path returns HTTP 404', ok: missing.status === 404, detail: `HTTP ${missing.status}` },
    { name: 'unknown path serves the HomeFinder 404 page', ok: /page not found/i.test(missing.text) && /HomeFinder/.test(missing.text), detail: '' },
    { name: 'SH3D delivery copy is served', ok: model.status === 200 && model.bytes > 1000, detail: `HTTP ${model.status}, ${model.bytes} bytes` }
  ];
  return { ok: results.every((r) => r.ok), results };
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8'
};

/** Serves dist the way a GitHub project page does: under /<repo>/, with 404.html for misses. */
export function startPagesLikeServer(distDir, basePath = '/HomeFinder-Official/', port = 0) {
  const root = resolve(distDir);
  const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = null;
    if (url.pathname.startsWith(base)) {
      const candidate = normalize(join(root, decodeURIComponent(url.pathname.slice(base.length))));
      if (candidate === root || candidate.startsWith(root + sep)) {
        if (existsSync(candidate) && statSync(candidate).isDirectory()) {
          file = existsSync(join(candidate, 'index.html')) ? join(candidate, 'index.html') : null;
        } else if (existsSync(candidate)) {
          file = candidate;
        }
      }
    }
    if (file) {
      res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(readFileSync(file));
      return;
    }
    const notFound = join(root, '404.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
  });
  return new Promise((done) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: bound } = server.address();
      done({ server, port: bound, url: `http://127.0.0.1:${bound}${base}` });
    });
  });
}
