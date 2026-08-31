import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../');
const repoRoot = path.resolve(here, '../../../');
const p03Candidate = process.env.HOMEFINDER_P03_MODEL_PATH ? path.resolve(process.env.HOMEFINDER_P03_MODEL_PATH) : null;
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', service: 'homefinder-browser-test-server', p03Candidate: Boolean(p03Candidate) }));
    return;
  }

  const decoded = decodeURIComponent((req.url || '/').split('?')[0]);
  const requested = decoded.replace(/^\/+/, '');
  const isAuthoritativeModel = requested === 'master/HomeFinder.sh3d';
  const repoRelative = requested.startsWith('active_development/') ? requested : null;
  const relative = repoRelative ? repoRelative : (decoded === '/' ? 'index.html' : requested);
  const target = isAuthoritativeModel && p03Candidate
    ? p03Candidate
    : isAuthoritativeModel
      ? path.resolve(repoRoot, relative)
      : repoRelative
        ? path.resolve(repoRoot, relative)
        : path.resolve(root, relative);
  const targetRoot = isAuthoritativeModel && p03Candidate ? path.dirname(p03Candidate) : repoRelative || isAuthoritativeModel ? repoRoot : root;
  if (!target.startsWith(targetRoot + path.sep) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`HomeFinder browser server listening on http://127.0.0.1:${port}`);
});
