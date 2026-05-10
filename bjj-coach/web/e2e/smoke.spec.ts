import { test, expect } from '@playwright/test';

test.describe('smoke: app boots and routes render', () => {
  test('home page renders', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('signup page renders email input', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('login page renders password input', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('public techniques page loads', async ({ page }) => {
    const response = await page.goto('/techniques');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('app-root')).toBeVisible();
  });
});
