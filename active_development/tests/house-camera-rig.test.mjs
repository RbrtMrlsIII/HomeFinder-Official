import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const read = (file) => fs.readFileSync(`${root}/${file}`, 'utf8');

test('A.4.2 defines an architectural house camera rig', () => {
  const rig = JSON.parse(read('data/house-camera-rig.json'));
  for (const id of ['arrival','front-door','hall','gallery','window','living','garden','library','lounge','stairs','study','directory','feature-wall','quiet','center-return','exit','front-door-return']) {
    const a = rig.anchors[id];
    assert.ok(a, `missing anchor ${id}`);
    assert.equal(a.position.length, 3);
    assert.equal(a.target.length, 3);
    assert.ok(a.fov >= 40 && a.fov <= 60);
  }
});

test('A.4.2 maps Home sections to architectural anchors', () => {
  const html = read('index.html');
  for (const anchor of ['hall','gallery','window','living','garden','library','lounge','stairs','study','directory','feature-wall','quiet','center-return','exit','front-door-return']) {
    assert.match(html, new RegExp(`data-camera-anchor="${anchor}"`));
  }
  assert.match(html, /data-cinematic-anchor="hero"/);
  assert.match(html, /data-cinematic-focal="hero-residence"/);
});

test('A.4.2 scroll choreography publishes camera state for the renderer', () => {
  const scroll = read('js/home/house-world-scroll.js');
  const rig = read('js/home/house-camera-rig.js');
  const renderer = read('js/reference-3d/cinematic-3d-renderer.js');
  assert.match(scroll, /hfHouseCamera/);
  assert.match(scroll, /setState/);
  assert.match(rig, /house-camera-rig\.json/);
  assert.match(rig, /hf:house-camera-update/);
  assert.match(renderer, /window\.__HF_HOUSE_CAMERA__/);
  assert.match(renderer, /function lookAt/);
});

test('A.4.2 keeps reduced motion and mobile camera scaling explicit', () => {
  const scroll = read('js/home/house-world-scroll.js');
  assert.match(scroll, /prefers-reduced-motion/);
  assert.match(scroll, /max-width: 700px/);
  assert.match(scroll, /mobile\.matches/);
});
