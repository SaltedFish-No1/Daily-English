import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('should display login page with branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('薄荷外语');
    await expect(page.getByText('每日一课，轻松进步')).toBeVisible();
  });

  test('should show email input and continue button', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', '邮箱地址');

    const continueBtn = page.getByRole('button', { name: '继续' });
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toBeDisabled(); // disabled when email is empty
  });

  test('should enable continue button when email is entered', async ({
    page,
  }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const continueBtn = page.getByRole('button', { name: '继续' });
    await expect(continueBtn).toBeEnabled();
  });

  test('should show guest skip link', async ({ page }) => {
    await page.goto('/login');
    const guestLink = page.getByText('跳过，以访客身份继续');
    await expect(guestLink).toBeVisible();
  });

  test('should navigate home when clicking guest skip', async ({ page }) => {
    await page.goto('/login');
    const guestLink = page.getByText('跳过，以访客身份继续');
    await guestLink.click();
    await expect(page).toHaveURL('/');
  });
});
