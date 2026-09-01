import { test, expect } from '@playwright/test';

const targets = [
  ['T02 Main Hall', 't02-main-hall', 't02-main-hall.png'],
  ['T03 Kitchen', 't03-h07-kitchen', 't03-kitchen.png'],
  ['T03 Bedroom #1', 't03-h08-bedroom1', 't03-bedroom1.png'],
  ['T04 Staircase', 't04-h1-basement-firstfloor', 't04-staircase.png'],
  ['T05 Level 1 Interior', 't05-h1-level1-interior-network', 't05-level1-interior.png']
];

test.describe('P04.4 fresh screenshot / visual review', () => {
  test('captures fresh visual evidence for every declared P04 target', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/3d/glb-viewer/index.html', { waitUntil: 'networkidle', timeout: 60000 });

    const stage = page.locator('.hf-cinematic-3d-stage');
    await expect(stage).toHaveAttribute('data-renderer', 'three-glb', { timeout: 60000 });

    for (const [name, id, filename] of targets) {
      await page.getByRole('button', { name: new RegExp(name, 'i') }).click();
      await expect(stage).toHaveAttribute('data-target-id', id);
      await expect(stage).toHaveAttribute('data-glb-loaded', 'true', { timeout: 60000 });
      await expect(page.locator('canvas.hf-cinematic-3d-canvas')).toBeVisible();
      await page.screenshot({ path: `playwright-report/p04.4-${filename}`, fullPage: true });
    }

    expect(errors).toEqual([]);
  });
});
