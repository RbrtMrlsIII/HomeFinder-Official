import { test, expect } from '@playwright/test';

const roles = ['guest', 'owner', 'seeker', 'broker', 'admin', 'moderator', 'staff'];

async function openViewer(page, role) {
  await page.addInitScript(({ role }) => sessionStorage.setItem('hf_account_role', role), { role });
  await page.goto('/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'House 1' })).toBeVisible();
}

test.describe('5.5G.6L inter-house browser journeys', () => {
  for (const role of roles) {
    test(`${role}: House 1 → House 2 preserves role-aware destination`, async ({ page }) => {
      await openViewer(page, role);
      await page.getByRole('button', { name: 'House 2' }).click();
      const status = page.locator('#homefinderHouseStatus');
      await expect(status).toContainText('House 2');
      await expect(page.locator('[data-house="house-2"]')).toHaveAttribute('aria-pressed', 'true');
    });

    test(`${role}: House 1 → House 3 preserves role-aware destination`, async ({ page }) => {
      await openViewer(page, role);
      await page.getByRole('button', { name: 'House 3' }).click();
      await expect(page.locator('#homefinderHouseStatus')).toContainText('House 3');
      await expect(page.locator('[data-house="house-3"]')).toHaveAttribute('aria-pressed', 'true');
    });
  }

  test('broker: House 2 → House 3 visibly resolves through House 1', async ({ page }) => {
    await openViewer(page, 'broker');
    await page.getByRole('button', { name: 'House 2' }).click();
    await expect(page.locator('#homefinderHouseStatus')).toContainText('House 2');

    await page.getByRole('button', { name: 'House 3' }).click();
    await expect(page.locator('#homefinderHouseStatus')).toContainText('continue to House 3');
    await expect(page.locator('[data-house="house-1"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('guest: restricted destinations do not become authenticated access', async ({ page }) => {
    await openViewer(page, 'guest');
    await page.getByRole('button', { name: 'House 2' }).click();
    await expect(page.locator('#homefinderHouseStatus')).toContainText('House 2');
    await expect(page.locator('[data-house="house-2"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-house="house-2"]')).toBeVisible();
  });
});
