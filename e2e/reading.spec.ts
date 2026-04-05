import { test, expect } from '@playwright/test';

test.describe('Reading / Lesson browsing', () => {
  test('should load the reading page with header', async ({ page }) => {
    await page.goto('/reading');
    await expect(page.locator('h1')).toContainText('阅读课程');
  });

  test('should display learning stats section', async ({ page }) => {
    await page.goto('/reading');
    await expect(page.getByText('已完成课程')).toBeVisible();
    await expect(page.getByText('收藏生词')).toBeVisible();
    await expect(page.getByText('平均正确率')).toBeVisible();
  });

  test('should render lesson cards if lessons exist', async ({ page }) => {
    await page.goto('/reading');
    // Each lesson card is a link to /lessons/{id}
    const lessonLinks = page.locator('a[href^="/lessons/"]');
    const count = await lessonLinks.count();
    if (count > 0) {
      // First card should have a title and teaser
      const firstCard = lessonLinks.first();
      await expect(firstCard.locator('h3')).toBeVisible();
    }
  });

  test('should navigate to lesson detail on card click', async ({ page }) => {
    await page.goto('/reading');
    const lessonLinks = page.locator('a[href^="/lessons/"]');
    const count = await lessonLinks.count();
    if (count > 0) {
      const href = await lessonLinks.first().getAttribute('href');
      await lessonLinks.first().click();
      await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});
