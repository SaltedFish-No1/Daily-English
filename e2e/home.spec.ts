import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('should load and display the app title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/薄荷外语/);
  });

  test('should show bottom navigation bar', async ({ page }) => {
    await page.goto('/');
    // The AppNavBar should be visible on mobile viewport
    const nav = page.locator('nav');
    await expect(nav.first()).toBeVisible();
  });

  test('should navigate to reading page from nav', async ({ page }) => {
    await page.goto('/');
    // Click on a nav link that leads to /reading
    const readingLink = page.locator('a[href="/reading"]');
    if (await readingLink.count()) {
      await readingLink.first().click();
      await expect(page).toHaveURL(/\/reading/);
    }
  });

  test('should navigate to login page from nav', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.locator('a[href="/login"]');
    if (await loginLink.count()) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
