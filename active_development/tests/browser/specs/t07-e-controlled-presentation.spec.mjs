import { test, expect } from '@playwright/test';

const viewerPath = '/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html';

test.describe('T07-E controlled presentation destinations', () => {
  test('exposes exactly the three T07-endorsed presentation controls', async ({ page }) => {
    await page.goto(viewerPath, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-t07e-camera]')).toHaveCount(3);
    for (const name of [/Living room · H-03/i, /Kitchen · H-07/i, /Bedroom #1 · H-08/i]) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
  });

  test('endorsed controls bind to existing canonical camera options', async ({ page }) => {
    await page.goto(viewerPath, { waitUntil: 'domcontentloaded' });
    const select = page.locator('#levelsAndCameras');
    await expect(page.getByRole('button', { name: /Living room · H-03/i })).toBeVisible();
    await expect.poll(async () => await select.locator('option').allTextContents()).toContain('HF H-03 — property-display');
    await expect.poll(async () => await select.locator('option').allTextContents()).toContain('HF H-07 — guide');
    await expect.poll(async () => await select.locator('option').allTextContents()).toContain('HF H-08 — safety');
  });
});
