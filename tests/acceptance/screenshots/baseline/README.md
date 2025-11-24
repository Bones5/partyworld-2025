# Baseline Screenshots

This directory stores baseline screenshots for visual regression testing.

## How It Works

1. **First Run**: When you run tests for the first time, Playwright will create baseline screenshots in this directory
2. **Subsequent Runs**: Future test runs will compare against these baselines
3. **Updating Baselines**: Run `npm run test:acceptance:update` to update baselines after intentional UI changes

## Directory Structure

After running tests, you'll see screenshots organized by:
- Browser/device project (chromium, mobile, tablet)
- Test file name
- Screenshot name

Example:
```
baseline/
├── homepage.spec.js/
│   ├── chromium/
│   │   ├── homepage-desktop.png
│   │   └── homepage-header.png
│   └── mobile/
│       └── homepage-mobile-menu-open.png
└── product-page.spec.js/
    └── chromium/
        └── product-page.png
```

## Best Practices

- **Commit baselines**: These should be tracked in git
- **Review changes**: Always inspect visual diffs before updating baselines
- **Document updates**: Note why baselines were updated in commit messages
- **Consistent environment**: Generate baselines in CI for consistency across team members

## Note

This directory will be empty until you run your first acceptance test and generate baseline screenshots.
