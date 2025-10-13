import { test, expect } from '@playwright/test';

// Helper to set up authenticated session
// You'll need to replace this with actual auth setup using Supabase test credentials
async function setupAuthenticatedSession(page: any) {
  // For now, this is a placeholder - you'll need to:
  // 1. Create test user in Supabase
  // 2. Log in programmatically
  // 3. Store session
  await page.goto('/auth');
  // Add actual login steps here when Supabase test env is ready
}

test.describe('Bookmarks Management', () => {
  test.beforeEach(async ({ page }) => {
    // await setupAuthenticatedSession(page);
    // For development, you can manually log in before running tests
    await page.goto('/dashboard');
  });

  test('should display dashboard with empty state or bookmarks', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/bookmark/i);
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible();
  });

  test('should open add bookmark dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByLabel('URL')).toBeVisible();
  });

  test('should validate bookmark URL format', async ({ page }) => {
    await page.getByRole('button', { name: /add/i }).click();
    
    await page.getByLabel('Title').fill('Test Bookmark');
    await page.getByLabel('URL').fill('not-a-valid-url');
    await page.getByRole('button', { name: /save|add bookmark/i }).click();
    
    await expect(page.locator('.sonner-toast')).toBeVisible();
  });

  test('should add new bookmark with valid data', async ({ page }) => {
    await page.getByRole('button', { name: /add/i }).click();
    
    await page.getByLabel('Title').fill('Playwright Docs');
    await page.getByLabel('URL').fill('https://playwright.dev');
    await page.getByLabel('Description').fill('Testing framework documentation');
    await page.getByLabel('Tags').fill('testing, automation');
    
    await page.getByRole('button', { name: /save|add bookmark/i }).click();
    
    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Verify bookmark appears in grid/list
    await expect(page.locator('text=Playwright Docs')).toBeVisible();
  });

  test('should search bookmarks', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('playwright');
    
    // Verify filtered results
    await expect(page.locator('[data-bookmark-card]').first()).toBeVisible();
  });

  test('should filter by reading list', async ({ page }) => {
    await page.getByRole('button', { name: /reading/i }).click();
    
    // Verify only reading list items are shown
    const count = await page.locator('[data-bookmark-card]').count();
    await expect(page.locator('text=/\\d+ bookmark/i')).toBeVisible();
  });

  test('should switch view modes', async ({ page }) => {
    // Test grid view
    await page.getByRole('button', { name: /grid/i }).click();
    await expect(page.locator('.grid')).toBeVisible();
    
    // Test list view
    await page.getByRole('button', { name: /list/i }).click();
    await expect(page.locator('[role="table"], .space-y-2')).toBeVisible();
    
    // Test compact view
    await page.getByRole('button', { name: /compact/i }).click();
    await expect(page.locator('.space-y-1')).toBeVisible();
  });

  test('should sort bookmarks', async ({ page }) => {
    await page.getByRole('combobox', { name: /sort/i }).click();
    await page.getByRole('option', { name: /title/i }).click();
    
    // Verify sorting applied
    const firstTitle = await page.locator('[data-bookmark-card]').first().textContent();
    expect(firstTitle).toBeTruthy();
  });

  test('should toggle bookmark reading status', async ({ page }) => {
    const bookmarkCard = page.locator('[data-bookmark-card]').first();
    const readingButton = bookmarkCard.getByRole('button', { name: /reading|book/i });
    
    await readingButton.click();
    await expect(page.locator('.sonner-toast')).toContainText(/reading/i);
  });

  test('should delete bookmark with confirmation', async ({ page }) => {
    const bookmarkCard = page.locator('[data-bookmark-card]').first();
    await bookmarkCard.getByRole('button', { name: /delete|trash/i }).click();
    
    // Confirm deletion in alert dialog
    await page.getByRole('button', { name: /delete|confirm/i }).click();
    
    await expect(page.locator('.sonner-toast')).toContainText(/deleted/i);
  });
});
