import { test, expect } from '@playwright/test';

const viewerPath = '/3d/glb-viewer/index.html';

const EXPECTED_CAMERAS = {
  't02-main-hall': {
    position: [3.5, 1.5, -5.6],
    target: [4.8, 0.85, -4.6],
    fov: 52.70715
  },
  't03-h07-kitchen': {
    position: [3.5, 1.7, -1.45],
    target: [2.1, 1.3, -1.1],
    fov: 58.441964
  },
  't03-h08-bedroom1': {
    position: [7.35, 1.75, -5],
    target: [8.5, 1.3, -4.7],
    fov: 56.150515
  },
  't04-h1-basement-firstfloor': {
    position: [-1.7, 1.78, -2.8],
    target: [1, 2.2, -6],
    fov: 48
  }
};

function cameraEquals(actual, expected) {
  return actual?.position?.every((v, i) => Math.abs(v - expected.position[i]) < 1e-6)
    && actual?.target?.every((v, i) => Math.abs(v - expected.target[i]) < 1e-6)
    && Math.abs(actual?.fov - expected.fov) < 1e-6;
}

test.describe('P04 spatial / visual validation', () => {
  test('initial GLB mount receives the active T02/H-03 source-backed target', async ({ page }) => {
    const errors = [];
    const cameraEvents = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.exposeFunction('__recordP04Target', detail => cameraEvents.push(detail));
    await page.addInitScript(() => {
      window.addEventListener('hf:cinematic-3d-target', e => window.__recordP04Target(e.detail));
    });

    await page.goto(viewerPath, { waitUntil: 'networkidle', timeout: 60000 });
    await expect(page.locator('.hf-cinematic-3d-stage')).toHaveAttribute('data-renderer', 'three-glb', { timeout: 60000 });
    const result = await page.evaluate(async () => {
      const manifest = await window.hfCinematic3D.loadTargetManifest();
      return { activeTarget: window.hfCinematic3D.activeTarget, target: manifest.targets['t02-main-hall'] };
    });

    expect(result.activeTarget).toBe('t02-main-hall');
    expect(cameraEquals(result.target.cameraThreeMeters, EXPECTED_CAMERAS['t02-main-hall'])).toBe(true);
    await page.screenshot({ path: 'p04-t02-h03.png' });
    expect(errors).toEqual([]);
  });

  for (const [targetId, expected] of Object.entries(EXPECTED_CAMERAS)) {
    test(`target ${targetId} resolves to the expected source-backed camera contract`, async ({ page }) => {
      const errors = [];
      let targetEvent = null;
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.exposeFunction('__recordP04Target', detail => { targetEvent = detail; });
      await page.addInitScript(() => {
        window.addEventListener('hf:cinematic-3d-target', e => window.__recordP04Target(e.detail));
      });

      await page.goto(viewerPath, { waitUntil: 'networkidle', timeout: 60000 });
      await expect(page.locator('.hf-cinematic-3d-stage')).toHaveAttribute('data-renderer', 'three-glb', { timeout: 60000 });
      await page.getByRole('button', { name: new RegExp(targetId.replace(/-/g, ' '), 'i') }).click();
      await expect.poll(() => targetEvent?.targetId).toBe(targetId);

      const target = await page.evaluate(async id => {
        const manifest = await window.hfCinematic3D.loadTargetManifest();
        return manifest.targets[id];
      }, targetId);
      expect(cameraEquals(target.cameraThreeMeters, expected)).toBe(true);
      expect(target.cameraBinding || target.cameraBindingStatus).toBeTruthy();
      await page.screenshot({ path: `p04-${targetId}.png` });
      expect(errors).toEqual([]);
    });
  }

  test('T05 preserves the level-1 elevation contract and does not invent a Bedroom #2 camera', async ({ page }) => {
    await page.goto(viewerPath, { waitUntil: 'networkidle', timeout: 60000 });
    await expect(page.locator('.hf-cinematic-3d-stage')).toHaveAttribute('data-renderer', 'three-glb', { timeout: 60000 });
    const target = await page.evaluate(async () => {
      const manifest = await window.hfCinematic3D.loadTargetManifest();
      return manifest.targets['t05-h1-level1-interior-network'];
    });
    expect(target.levelElevationCm).toBe(112);
    expect(target.cameraBinding['Living room'].pov).toBe('H-03');
    expect(target.cameraBinding['Bedroom #2'].pov).toBeNull();
    await page.getByRole('button', { name: /T05 Level 1 Interior/i }).click();
    await expect(page.locator('#status')).toContainText('Target: t05-h1-level1-interior-network');
    await page.screenshot({ path: 'p04-t05-level1.png' });
  });
});
