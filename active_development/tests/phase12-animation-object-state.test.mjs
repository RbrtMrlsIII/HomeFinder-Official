import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('js/physical-ui-state.js','utf8');
function load() {
  const events = [];
  const window = { dispatchEvent(e){ events.push(e); }, matchMedia(){ return {matches:false}; }, innerWidth:1440, innerHeight:900 };
  const document = { documentElement:{}, }; 
  const context = { window, document, CustomEvent: class { constructor(type, init){ this.type=type; this.detail=init?.detail; } }, console };
  vm.runInNewContext(source, context);
  return { api: window.hfPhysicalUIState, events };
}

test('state machine follows allowed interaction path and rejects invalid jumps', () => {
  const {api} = load();
  assert.equal(api.stateFor('idle','activate'),'interaction-start');
  assert.equal(api.stateFor('interaction-start','open'),'ui-open');
  assert.equal(api.stateFor('ui-open','loading'),'loading');
  assert.equal(api.stateFor('loading','success'),'success');
  assert.equal(api.stateFor('success','loading'),'success');
  assert.equal(api.stateFor('disabled','open'),'disabled');
  assert.equal(api.stateFor('disabled','enable'),'idle');
  assert.equal(api.stateFor('idle','unknown'),'idle');
});

test('responsive transformer distinguishes portrait, landscape, tablet and wide modes', () => {
  const {api} = load();
  const node = { dataset:{}, style:{setProperty(k,v){this[k]=v;}} };
  const object = {id:'x', responsive:'root'};
  api.applyResponsive(node, object, {width:390,height:844,smallest:390,density:.88,uiScale:.92});
  assert.equal(node.dataset.hfResponsiveMode,'mobile-portrait');
  api.applyResponsive(node, object, {width:844,height:390,smallest:390,density:.94,uiScale:.96});
  assert.equal(node.dataset.hfResponsiveMode,'mobile-landscape');
  api.applyResponsive(node, object, {width:1024,height:768,smallest:768,density:1,uiScale:1});
  assert.equal(node.dataset.hfResponsiveMode,'tablet');
  api.applyResponsive(node, object, {width:1920,height:1080,smallest:1080,density:1,uiScale:1});
  assert.equal(node.dataset.hfResponsiveMode,'wide-desktop');
});

console.log('PASS phase12 object state behavior');
