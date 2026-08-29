import { test, expect } from '@playwright/test';

const roles = ['guest', 'owner', 'seeker', 'broker', 'admin', 'moderator', 'staff'];
const destinationRoutes = {
  'house-2': {
    guest: 'login.html', owner: 'profile.html', seeker: 'profile.html', broker: 'broker-hq.html',
    admin: 'admin.html', moderator: 'moderator.html', staff: 'staff.html'
  },
  'house-3': {
    guest: 'login.html', owner: 'market.html', seeker: 'market.html', broker: 'broker-hq.html',
    admin: 'admin.html', moderator: 'moderator.html', staff: 'staff.html'
  }
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function openViewer(page, role) {
  await page.addInitScript(({ role }) => sessionStorage.setItem('hf_account_role', role), { role });
  await page.goto('/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'House 1' })).toBeVisible();
}

test.describe('5.5G.6M.4 browser acceptance contract', () => {
  for (const [house, roleRoutes] of Object.entries(destinationRoutes)) {
    const buttonName = house === 'house-2' ? 'House 2' : 'House 3';

    for (const role of roles) {
      test(`${role}: House 1 → ${house} reaches the role-aware application route`, async ({ page }) => {
        await openViewer(page, role);
        await page.getByRole('button', { name: buttonName }).click();

        const expectedRoute = roleRoutes[role];
        await expect(page).toHaveURL(new RegExp(`/${escapeRegExp(expectedRoute)}$`));
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem('hf_account_role'))).toBe(role);
      });
    }
  }

  test('broker: House 2 → House 3 remains hub-routed by the canonical navigation contract', async ({ page }) => {
    await page.goto('/tests/browser/inter-house-navigation.runtime.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#result')).toContainText('"status": "PASS"');
  });

  test('guest: restricted House 2 and House 3 destinations resolve to login', async ({ page }) => {
    await openViewer(page, 'guest');

    await page.getByRole('button', { name: 'House 2' }).click();
    await expect(page).toHaveURL(/\/login\.html$/);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('hf_account_role'))).toBe('guest');

    await page.goto('/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'House 3' }).click();
    await expect(page).toHaveURL(/\/login\.html$/);
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('hf_account_role'))).toBe('guest');
  });
});
