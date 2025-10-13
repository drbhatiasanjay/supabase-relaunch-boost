# Playwright Tests for BookmarkHub

## Setup

1. Install Playwright browsers:
```bash
npx playwright install
```

2. Make sure your dev server is running (Playwright will auto-start it):
```bash
npm run dev
```

## Running Tests

Run all tests:
```bash
npx playwright test
```

Run specific test file:
```bash
npx playwright test tests/auth.spec.ts
```

Run tests in UI mode (recommended for development):
```bash
npx playwright test --ui
```

Run tests in headed mode (see browser):
```bash
npx playwright test --headed
```

Run tests in specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## View Test Report

After running tests:
```bash
npx playwright show-report
```

## Test Coverage

### Auth Tests (`tests/auth.spec.ts`)
- ✅ Display auth page UI
- ✅ Switch between login/signup tabs
- ✅ Validate email format
- ✅ Validate password requirements
- 🔒 Actual login/signup (requires Supabase test credentials)

### Bookmarks Tests (`tests/bookmarks.spec.ts`)
- ✅ Display dashboard
- ✅ Open add bookmark dialog
- ✅ Validate bookmark URL
- ✅ Add new bookmark
- ✅ Search bookmarks
- ✅ Filter by reading list
- ✅ Switch view modes (grid/list/compact)
- ✅ Sort bookmarks
- ✅ Toggle reading status
- ✅ Delete bookmark

### Import/Export Tests (`tests/import-export.spec.ts`)
- ✅ Open import/export dialog
- ✅ Display import UI
- ✅ Import Chrome/Firefox bookmarks HTML
- ✅ Export as JSON
- ✅ Export as HTML
- ✅ Show success messages

### Filtering/Sorting Tests (`tests/filtering-sorting.spec.ts`)
- ✅ Display filter controls
- ✅ Filter by category
- ✅ Sort by date
- ✅ Sort by title
- ✅ Sort by category
- ✅ Combine filters
- ✅ Update counts dynamically
- ✅ Handle empty results
- ✅ Clear filters

## Setting Up Supabase Test Environment

For full authentication testing, you'll need to:

1. Create a Supabase test project or use a dedicated test schema
2. Set up test credentials in `.env.test`:
```env
VITE_SUPABASE_URL=your-test-url
VITE_SUPABASE_ANON_KEY=your-test-key
```

3. Uncomment the authentication tests in `tests/auth.spec.ts`
4. Update `setupAuthenticatedSession()` helper in `tests/bookmarks.spec.ts`

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run tests
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Tips

- Use `test.only()` to run a single test during development
- Use `test.skip()` to temporarily skip tests
- Add `data-testid` attributes to components for reliable selectors
- Use Page Object Model pattern for larger test suites
- Check `playwright.config.ts` for timeout and retry settings
