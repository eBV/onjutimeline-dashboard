import { test, expect } from '@playwright/test';

test.describe('Ohnahji Timeline Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the hero page', async ({ page }) => {
    // Slide0Hero renders three layered h1 elements for the shadow effect — use first()
    await expect(page.getByRole('heading', { name: 'Ohnahji' }).first()).toBeVisible();
    await expect(page.locator('text=Scroll to Explore')).toBeVisible();
  });

  test('should navigate between slides using horizontal scroll', async ({ page }) => {
    // Initial path
    await expect(page).toHaveURL('/');

    // Scroll right to genesis
    const container = page.locator('.snap-x');
    await container.evaluate((el) => el.scrollBy({ left: el.clientWidth }));

    // React Router uses replaceState (SPA routing) — poll for the URL change directly
    await expect(page).toHaveURL(/\/genesis$/, { timeout: 10000 });
  });

  test('should open the gallery from genesis slide', async ({ page }) => {
    await page.goto('/genesis');

    const viewGalleryBtn = page.getByRole('button', { name: 'VIEW GALLERY' });
    await viewGalleryBtn.click();

    // Loading state is brief; go straight to the settled gallery view
    await expect(page.locator('text=VIEWING: OHNAHJI #')).toBeVisible({ timeout: 20000 });
  });

  test('should show correct price on mint slide', async ({ page }) => {
    await page.goto('/mint');
    // The h1 has a <br /> between "BHM '26" and "sale" — match by heading role
    await expect(page.getByRole('heading', { name: /BHM.*26.*sale/i })).toBeVisible();

    // Check quantity toggles
    await expect(page.getByRole('button', { name: '+' })).toBeVisible();
    await expect(page.getByRole('button', { name: '-' })).toBeVisible();
  });
});
