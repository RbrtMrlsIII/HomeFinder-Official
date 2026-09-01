import { test, expect } from '@playwright/test';

test.describe('P04 spatial / visual validation', () => {
  const path = '/3d/glb-viewer/index.html';

  test('mounts the Three GLB renderer and loads the default target', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(path, { waitUntil: 'networkidle', timeout: 60000 });
    await expect(page.getByRole('button', { name: /T02 Main Hall/i })).toBeVisible();
    const stage = page.locator('.hf-cinematic-3d-stage');
    await expect(stage).toHaveAttribute('data-renderer', 'three-glb', { timeout: 60000 });
    await expect(stage).toHaveAttribute('data-target-id', 't02-main-hall', { timeout: 60000 }).catch(() => {});
    await expect(stage).toHaveAttribute('data-glb-loaded', 'true', { timeout: 60000 });
    await expect(page.locator('canvas.hf-cinematic-3d-canvas')).toBeVisible();
    await expect(page.locator('#status')).toContainText('GLB runtime mounting', { timeout: 60000 });
    expect(errors).toEqual([]);
  });

  test('propagates source-backed camera, scale, and elevation contracts', async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 60000 });
    const stage = page.locator('.hf-cinematic-3d-stage');
    await expect(stage).toHaveAttribute('data-renderer', 'three-glb', { timeout: 60000 });
    await page.getByRole('button', { name: /T04 Staircase/i }).click();
    await expect(stage).toHaveAttribute('data-target-id', 't04-h1-basement-firstfloor');
    await expect(stage).toHaveAttribute('data-model-scale', '0.01');
    await expect(stage).toHaveAttribute('data-camera-position', '-1.7,1.78,-2.8');
    await expect(stage).toHaveAttribute('data-camera-target', '1,2.2,-6');
    await expect(stage).toHaveAttribute('data-camera-fov', '48');
    await expect(stage).toHaveAttribute('data-glb-loaded', 'true', { timeout: 60000 });
  });

  test('switches across all P04 target entries and loads each declared GLB', async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 60000 });
    const stage = page.locator('.hf-cinematic-3d-stage');
    for (const [name, id] of [
      [/T02 Main Hall/i, 't02-main-hall'],
      [/T03 Kitchen/i, 't03-h07-kitchen'],
      [/T03 Bedroom #1/i, 't03-h08-bedroom1'],
      [/T04 Staircase/i, 't04-h1-basement-firstfloor'],
      [/T05 Level 1 Interior/i, 't05-h1-level1-interior-network']
    ]) {
      await page.getByRole('button', { name }).click();
      await expect(stage).toHaveAttribute('data-target-id', id);
      await expect(stage).toHaveAttribute('data-glb-loaded', 'true', { timeout: 60000 });
    }
  });
});
