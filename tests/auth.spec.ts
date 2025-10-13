import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display auth page with login tab', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('BookmarkHub');
    await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible();
  });

  test('should switch between login and signup tabs', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    
    await page.getByRole('tab', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Toast should appear with error
    await expect(page.locator('.sonner-toast')).toBeVisible();
  });

  test('should show validation errors for short password on signup', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: /sign up/i }).click();
    
    await expect(page.locator('.sonner-toast')).toBeVisible();
  });

  // Note: Actual login/signup tests would require Supabase test environment
  // Uncomment and modify these when you have test credentials
  
  // test('should successfully sign up new user', async ({ page }) => {
  //   await page.getByRole('tab', { name: 'Sign Up' }).click();
  //   await page.getByLabel('Email').fill('testuser@example.com');
  //   await page.getByLabel('Password').fill('TestPassword123!');
  //   await page.getByRole('button', { name: /sign up/i }).click();
  //   
  //   await expect(page).toHaveURL('/dashboard');
  // });

  // test('should successfully log in existing user', async ({ page }) => {
  //   await page.getByLabel('Email').fill('testuser@example.com');
  //   await page.getByLabel('Password').fill('TestPassword123!');
  //   await page.getByRole('button', { name: /log in/i }).click();
  //   
  //   await expect(page).toHaveURL('/dashboard');
  // });
});
