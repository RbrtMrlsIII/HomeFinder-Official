import { test, expect } from '@playwright/test';

test('HomeFinder browser health', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'HomeFinder 3D Home' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'House 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'House 2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'House 3' })).toBeVisible();
  await expect(page.locator('#homefinderHouseStatus')).toContainText('House 1');
  expect(consoleErrors).toEqual([]);
});
