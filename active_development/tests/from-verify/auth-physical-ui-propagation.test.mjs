import fs from 'fs';
import path from 'path';
import assert from 'assert';
const root = path.resolve(process.cwd());
for (const page of ['login','register']) {
  const html = fs.readFileSync(path.join(root, `${page}.html`), 'utf8');
  assert(html.includes('js/auth-physical-ui.js'), `${page} missing auth physical UI runtime`);
  assert(html.includes('data-hf-auth-root'), `${page} missing auth root marker`);
}
for (const page of ['login','register']) {
  const f = path.join(root, 'data', `${page}-physical-ui-objects.json`);
  const j = JSON.parse(fs.readFileSync(f,'utf8'));
  assert(j.objects.length >= 6, `${page} object catalog too small`);
  for (const o of j.objects) {
    assert(o.id && o.selector && o.pov && o.responsive && o.animation, `${page} object incomplete: ${o.id}`);
  }
}
const runtime = fs.readFileSync(path.join(root,'js','auth-physical-ui.js'),'utf8');
assert(runtime.includes('hfPhysicalUIState'));
assert(runtime.includes('hfAnimationRoot'));
assert(runtime.includes('hfDesignRoots'));
console.log('auth physical UI propagation: PASS');
