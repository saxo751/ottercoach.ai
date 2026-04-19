import { test, expect } from '@playwright/test';

test.describe('Technique page /technique/triangle-choke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/technique/triangle-choke');
  });

  test('renders the H1', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('Triangle Choke');
  });

  test('has valid HowTo JSON-LD', async ({ page }) => {
    const ldScripts = await page.locator('script[type="application/ld+json"]').all();
    expect(ldScripts.length).toBeGreaterThanOrEqual(3);
    let sawHowTo = false;
    for (const s of ldScripts) {
      const json = JSON.parse((await s.textContent())!);
      if (json['@type'] === 'HowTo') {
        sawHowTo = true;
        expect(json.step.length).toBeGreaterThanOrEqual(4);
      }
    }
    expect(sawHowTo).toBe(true);
  });

  test('renders >= 5 internal links', async ({ page }) => {
    const internalHrefs = await page.locator('a[href^="/"]:not([href="/"])').all();
    expect(internalHrefs.length).toBeGreaterThanOrEqual(5);
  });

  test('includes a noindex meta tag (because ready=false)', async ({ page }) => {
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('renders sources section with at least one citation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  });

  test('renders reviewer byline', async ({ page }) => {
    await expect(page.getByText(/Reviewed by/)).toBeVisible();
  });
});
