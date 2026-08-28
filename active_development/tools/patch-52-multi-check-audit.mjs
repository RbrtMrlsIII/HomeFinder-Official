import fs from 'node:fs';
import path from 'node:path';

export function runMultiCheckAudit(root = process.cwd()) {
  const failures = [];
  const warnings = [];
  const checks = [];
  const exists = p => fs.existsSync(path.join(root, p));
  const read = p => fs.readFileSync(path.join(root, p), 'utf8');
  const pass = (id, detail) => checks.push({ id, status: 'PASS', detail });
  const fail = (id, detail) => { checks.push({ id, status: 'FAIL', detail }); failures.push(`${id}: ${detail}`); };
  const warn = (id, detail) => { checks.push({ id, status: 'WARN', detail }); warnings.push(`${id}: ${detail}`); };

  // 1. Authoritative registries and governance passages.
  for (const p of [
    'docs/core/01-SOURCE-OF-TRUTH.md',
    'docs/dictionary/INDEX.json',
    'docs/dictionary/CONTRACT-CHANGE-RULE.md',
    'docs/dictionary/PHASE-ROADMAP.md',
    'docs/dictionary/domains/authority.dictionary.json',
    'docs/dictionary/domains/data.dictionary.json',
    'docs/dictionary/domains/roles.dictionary.json',
    'docs/dictionary/domains/capabilities.dictionary.json',
    'docs/dictionary/domains/routes.dictionary.json',
    'docs/dictionary/domains/integrations.dictionary.json',
    'docs/dictionary/domains/ui-ownership.dictionary.json',
    'docs/dictionary/domains/lifecycle.dictionary.json',
    'docs/dictionary/domains/capability-boundaries.dictionary.json',
    'docs/dictionary/domains/compatibility.dictionary.json'
  ]) exists(p) ? pass(`AUTH:${p}`, 'present') : fail(`AUTH:${p}`, 'missing');

  // 2. Dictionary index designated domain passages resolve to real files.
  try {
    const index = JSON.parse(read('docs/dictionary/INDEX.json'));
    for (const p of [...index.domains, ...(index.legacySources || [])]) {
      exists(`docs/dictionary/${p}`) || exists(p)
        ? pass(`DICT:${p}`, 'registry target resolves')
        : fail(`DICT:${p}`, 'registry target missing');
    }
    for (const key of ['authority','changeRule','roadmap']) {
      if (typeof index[key] !== 'string') fail(`DICT:INDEX:${key}`, 'missing registry pointer');
    }
  } catch (e) { fail('DICT:INDEX', `invalid JSON: ${e.message}`); }

  // 3. HTML local src/href passages resolve. External URLs are intentionally ignored.
  const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));
  const attrRe = /(?:src|href)\s*=\s*["']([^"'#?]+)(?:[?#][^"']*)?["']/gi;
  for (const file of htmlFiles) {
    const text = read(file);
    let m;
    while ((m = attrRe.exec(text))) {
      const ref = m[1];
      if (/^(?:https?:|mailto:|tel:|javascript:|data:|#|\/)/i.test(ref)) continue;
      if (/\.(?:js|css|json|png|jpe?g|webp|svg|ico|html)$/i.test(ref) || ref.includes('/')) {
        if (!exists(ref) && (ref === 'assets/' || ref.startsWith('assets/')) && !exists('assets')) {
          warn(`HTML:${file}->${ref}`, 'asset target intentionally omitted by checkpoint packaging policy');
        } else {
          exists(ref) ? pass(`HTML:${file}->${ref}`, 'local target resolves') : fail(`HTML:${file}->${ref}`, 'local target missing');
        }
      }
    }
  }

  // 4. Relative JS imports resolve. Bare package/external URL imports are intentionally excluded.
  const jsFiles = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p); else if (/\.(?:js|mjs|ts)$/.test(ent.name)) jsFiles.push(p);
    }
  }
  walk(root);
  const importRe = /(?:import\s+(?:[^'";]+?\s+from\s+)?|export\s+[^'";]+?\s+from\s+)["']([^"']+)["']/g;
  for (const file of jsFiles) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = importRe.exec(text))) {
      const ref = m[1];
      if (!ref.startsWith('.')) continue;
      const base = path.resolve(path.dirname(file), ref);
      const candidates = [base, `${base}.js`, `${base}.mjs`, `${base}.ts`, path.join(base, 'index.js')];
      const rel = path.relative(root, file).replaceAll(path.sep, '/') + ` -> ${ref}`;
      candidates.some(fs.existsSync) ? pass(`IMPORT:${rel}`, 'relative import resolves') : fail(`IMPORT:${rel}`, 'relative import missing');
    }
  }

  // 5. Firebase function entrypoint passage.
  try {
    const pkg = JSON.parse(read('firebase/functions/package.json'));
    const main = pkg.main || 'index.js';
    exists(`firebase/functions/${main}`) ? pass('FIREBASE:function-main', main) : fail('FIREBASE:function-main', `missing ${main}`);
  } catch (e) { fail('FIREBASE:function-package', e.message); }
  exists('firebase/firestore.rules') ? pass('FIREBASE:rules', 'present') : fail('FIREBASE:rules', 'missing');
  exists('firebase.json') ? pass('FIREBASE:config', 'present') : fail('FIREBASE:config', 'missing');

  // 6. Integration passages: docs exist and are explicitly documentation boundaries.
  for (const p of [
    'docs/integrations/paypal/README.md',
    'docs/integrations/paypal/06-PAYMENTS.md',
    'docs/integrations/cloudflare/README.md',
    'docs/integrations/cloudflare/worker_js.md',
    'docs/integrations/cloudflare/PRODUCTION-CHECKLIST.md',
    'docs/integrations/cloudflare/WORKER-RECOVERY-GATE.md'
  ]) exists(p) ? pass(`INTEGRATION:${p}`, 'present') : fail(`INTEGRATION:${p}`, 'missing');

  // 7. Compatibility retirement passage must remain closed.
  const retiredRefs = [
    'js/tiers.js',
    'js/admin/users.js',
    'firebase/firestore.rules',
    'firebase/functions/index.js'
  ];
  const forbidden = /(?:boost\.(?:level)|\blevel\s*[:=]\s*['"](?:I|II|III|IV|V)['"]|normalizeBoostPackageValue)/;
  for (const p of retiredRefs) {
    const text = read(p);
    forbidden.test(text) ? fail(`RETIREMENT:${p}`, 'legacy boost parser vocabulary remains') : pass(`RETIREMENT:${p}`, 'canonical parser surface clean');
  }

  // 8. Compact wiring map is mandatory for UI/UX readiness.
  exists('docs/architecture/PATCH-52-MULTI-CHECK-WIRING-MAP.json')
    ? pass('WIRING:map', 'present')
    : fail('WIRING:map', 'missing');

  // 9. No root NEXT_PATCH pointer existed in the baseline. Treat absence as a warning for controlled repair.
  exists('NEXT_PATCH.md') ? pass('NEXT:root-pointer', 'present') : warn('NEXT:root-pointer', 'missing; patch 52 creates authoritative pointer');

  return {
    patch: '52',
    status: failures.length ? 'blocked' : 'ready',
    checks,
    failureCount: failures.length,
    warningCount: warnings.length,
    failures,
    warnings
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runMultiCheckAudit();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.failureCount ? 1 : 0;
}
