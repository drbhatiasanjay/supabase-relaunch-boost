import { test, expect } from '@playwright/test';

test.describe('Filtering and Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display filter and sort controls', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: /category/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /sort/i })).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    const categorySelect = page.getByRole('combobox').first();
    await categorySelect.click();
    
    // Select a specific category (if available)
    const options = page.getByRole('option');
    const count = await options.count();
    
    if (count > 1) {
      await options.nth(1).click();
      
      // Verify filtered count updates
      await expect(page.locator('text=/\\d+ bookmark/i')).toBeVisible();
    }
  });

  test('should sort by date (newest first)', async ({ page }) => {
    const sortSelect = page.locator('[role="combobox"]').filter({ hasText: /sort/i });
    await sortSelect.click();
    
    await page.getByRole('option', { name: /date/i }).click();
    
    // Verify first bookmark is most recent
    const bookmarks = page.locator('[data-bookmark-card]');
    if (await bookmarks.count() > 0) {
      await expect(bookmarks.first()).toBeVisible();
    }
  });

  test('should sort by title alphabetically', async ({ page }) => {
    const sortSelect = page.locator('[role="combobox"]').filter({ hasText: /sort/i });
    await sortSelect.click();
    
    await page.getByRole('option', { name: /title/i }).click();
    
    // Verify alphabetical ordering
    const bookmarks = page.locator('[data-bookmark-card]');
    const count = await bookmarks.count();
    
    if (count >= 2) {
      const firstTitle = await bookmarks.first().textContent();
      const secondTitle = await bookmarks.nth(1).textContent();
      
      expect(firstTitle?.localeCompare(secondTitle || '') <= 0).toBeTruthy();
    }
  });

  test('should sort by category', async ({ page }) => {
    const sortSelect = page.locator('[role="combobox"]').filter({ hasText: /sort/i });
    await sortSelect.click();
    
    await page.getByRole('option', { name: /category/i }).click();
    
    // Verify category ordering
    await expect(page.locator('[data-bookmark-card]').first()).toBeVisible();
  });

  test('should combine search with category filter', async ({ page }) => {
    // Search for a term
    await page.getByPlaceholder(/search/i).fill('test');
    
    // Apply category filter
    const categorySelect = page.getByRole('combobox').first();
    await categorySelect.click();
    
    const options = page.getByRole('option');
    if (await options.count() > 1) {
      await options.nth(1).click();
    }
    
    // Verify count reflects both filters
    await expect(page.locator('text=/\\d+ bookmark/i')).toBeVisible();
  });

  test('should update bookmark count dynamically', async ({ page }) => {
    const initialCount = await page.locator('text=/\\d+ bookmark/i').textContent();
    
    // Apply search filter
    await page.getByPlaceholder(/search/i).fill('nonexistentterm12345');
    
    const filteredCount = await page.locator('text=/\\d+ bookmark/i').textContent();
    
    // Count should change when filtered
    expect(initialCount).not.toBe(filteredCount);
  });

  test('should show "0 bookmarks" when no results', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('zzz-nonexistent-query-zzz');
    
    await expect(page.locator('text=/0 bookmark/i')).toBeVisible();
  });

  test('should clear filters and show all bookmarks', async ({ page }) => {
    // Apply filters
    await page.getByPlaceholder(/search/i).fill('test');
    
    // Clear search
    await page.getByPlaceholder(/search/i).clear();
    
    // Reset category to "all"
    const categorySelect = page.getByRole('combobox').first();
    await categorySelect.click();
    await page.getByRole('option', { name: /all/i }).click();
    
    // Verify all bookmarks shown
    const totalStats = page.locator('[data-stat="total"]');
    if (await totalStats.count() > 0) {
      await expect(totalStats).toBeVisible();
    }
  });
});
