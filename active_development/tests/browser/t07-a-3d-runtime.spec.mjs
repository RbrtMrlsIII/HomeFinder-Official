import { test, expect } from '@playwright/test';

const viewerPath =
  '/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html';

test.describe('T07-A 3D web runtime', () => {
  test('viewer loads with a usable WebGL canvas and no fatal runtime error', async ({
    page,
  }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto(viewerPath, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveTitle(/HomeFinder|Sweet Home 3D/i);

    const canvas = page.locator('canvas').first();

    await expect(canvas).toBeVisible({
      timeout: 15000,
    });

    const canvasState = await canvas.evaluate((node) => {
      const gl =
        node.getContext('webgl2') ||
        node.getContext('webgl');

      const rect = node.getBoundingClientRect();

      return {
        webgl: Boolean(gl),
        width: rect.width,
        height: rect.height,
      };
    });

    expect(canvasState.webgl).toBeTruthy();
    expect(canvasState.width).toBeGreaterThan(0);
    expect(canvasState.height).toBeGreaterThan(0);

    const fatalErrors = consoleErrors.filter((message) =>
      /uncaught|failed to load|webgl.*error|shader.*error|cannot read propert/i.test(
        message
      )
    );

    expect(fatalErrors).toEqual([]);
  });

  test('viewer exposes the T07 house navigation controls', async ({
    page,
  }) => {
    await page.goto(viewerPath, {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      page.getByRole('button', { name: /house 1/i })
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /house 2/i })
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /house 3/i })
    ).toBeVisible();
  });
});
