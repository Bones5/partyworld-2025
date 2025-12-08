# CI and Branch Protection Setup

This document describes the continuous integration (CI) setup and recommended branch protection rules for the Partyworld 2025 theme.

## Overview

The repository uses GitHub Actions for continuous integration with three main workflows:

1. **Unit Tests** (`unit-tests.yml`) - Runs Jest unit tests
2. **E2E Tests** (`playwright.yml`) - Runs Playwright end-to-end tests
3. **Theme Bundling** (`pull_request_review.yml`) - Validates theme bundling with Stencil CLI

## Test Structure

### Unit Tests (Jest)
- **Location**: `assets/js/test-unit/`
- **Framework**: Jest with jsdom
- **Command**: `npm test`
- **Configuration**: `jest.config.js`
- **Purpose**: Tests JavaScript modules, utilities, and components in isolation

The Jest configuration explicitly excludes e2e tests using:
- `testMatch`: Only matches files in `assets/js/test-unit/**/*.spec.js`
- `testPathIgnorePatterns`: Excludes `/tests/e2e/` directory

### End-to-End Tests (Playwright)
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Command**: `npm run test:e2e`
- **Configuration**: `playwright.config.js`
- **Purpose**: Tests complete user workflows and design system implementation

### Theme Bundling
- **Command**: `npx stencil bundle`
- **Purpose**: Validates that the theme can be successfully bundled for deployment
- **Additional Checks**: Runs ESLint and Stylelint via `npx grunt check`

## Workflows

### unit-tests.yml
**Triggers:**
- Push to `master`, `main`, or `develop` branches
- Pull requests targeting these branches

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run unit tests (`npm test`)
5. Upload test coverage artifacts

**Status Check Name**: `Run Jest Unit Tests`

### playwright.yml
**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting these branches

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Install Playwright browsers
5. Run E2E tests (`npm run test:e2e`)
6. Upload test results and screenshots

**Status Check Name**: `Run Playwright E2E Tests`

### pull_request_review.yml
**Triggers:**
- Push to `master` or `main` branches
- Pull requests targeting these branches

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install Stencil CLI
4. Install dependencies (`npm ci`)
5. Run linting and code quality checks (`npx grunt check`)
6. Run unit tests (`npm test`)
7. Bundle theme (`npx stencil bundle`)
8. Upload bundled theme and bundle analysis

**Status Check Name**: `build (ubuntu-latest, 20.x)`

## Branch Protection Rules

### Recommended Settings for `main`/`master` Branch

#### 1. Require Pull Request Reviews
- **Require approvals**: At least 1
- **Dismiss stale reviews**: Enabled (when new commits are pushed)
- **Require review from Code Owners**: Optional (if using CODEOWNERS file)

#### 2. Require Status Checks
Enable the following required status checks before merging:

**Required Checks:**
- ✅ `Run Jest Unit Tests` (from unit-tests.yml)
- ✅ `Run Playwright E2E Tests` (from playwright.yml)
- ✅ `build (ubuntu-latest, 20.x)` (from pull_request_review.yml)

**Configuration:**
- ✅ **Require branches to be up to date before merging**: Enabled
  - This ensures PRs are tested against the latest code
  - May slow down merging if multiple PRs are ready simultaneously
  
**Alternative Configuration (faster merging):**
- ⚠️ **Require branches to be up to date before merging**: Disabled
  - Faster PR merging
  - Use the `update-branches-on-merge.yml` workflow to keep feature branches updated
  - Slightly higher risk of integration issues

#### 3. Require Conversation Resolution
- **Enabled**: All PR conversations must be resolved before merging

#### 4. Require Linear History
- **Optional**: Enforces linear history (no merge commits)
- **Note**: This requires using squash or rebase merging

#### 5. Do Not Allow Bypassing
- **Do not allow bypassing the above settings**: Enabled
- **Exceptions**: Repository admins only if absolutely necessary

### Recommended Settings for `develop` Branch

Use the same settings as `main`/`master`, or optionally:
- Reduce required approvals to 0 for faster iteration
- Keep all status checks required

## Setting Up Branch Protection

### Via GitHub UI

1. Navigate to repository **Settings**
2. Click **Branches** in the left sidebar
3. Click **Add branch protection rule**
4. Enter branch name pattern: `main` (or `master`)
5. Enable the following:
   - ☑️ Require a pull request before merging
     - ☑️ Require approvals: 1
     - ☑️ Dismiss stale pull request approvals when new commits are pushed
   - ☑️ Require status checks to pass before merging
     - ☑️ Require branches to be up to date before merging
     - Search and add these required checks:
       - `Run Jest Unit Tests`
       - `Run Playwright E2E Tests`
       - `build (ubuntu-latest, 20.x)`
   - ☑️ Require conversation resolution before merging
   - ☑️ Do not allow bypassing the above settings
6. Click **Create** or **Save changes**
7. Repeat for `develop` branch if needed

### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Set up branch protection for main branch
# Replace :owner/:repo with actual values (e.g., gh api repos/Bones5/partyworld-2025/branches/main/protection)
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Run Jest Unit Tests","Run Playwright E2E Tests","build (ubuntu-latest, 20.x)"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field required_conversation_resolution=true \
  --field restrictions=null
```

## Troubleshooting

### Status Check Not Appearing

If a required status check doesn't appear in the branch protection settings:

1. The workflow must run at least once on a PR
2. The job name in the workflow file determines the status check name
3. For matrix builds, the status check name includes matrix variables: `job-name (matrix-value)`

### Tests Failing on CI but Passing Locally

1. Ensure you have the same Node.js version (check `.nvmrc` or workflow files)
2. Run `npm ci` instead of `npm install` for clean installs
3. Check for environment-specific issues (file paths, env variables)
4. Review the CI logs in the Actions tab

### Workflow Not Triggering

1. Check that the branch name matches the workflow trigger branches
2. Verify the workflow file is in `.github/workflows/` directory
3. Check for YAML syntax errors
4. Workflows on new branches may require a push to trigger

### Separating Unit and E2E Tests

The repository now properly separates unit tests from e2e tests:

- **Jest (Unit Tests)**: Uses `testMatch` to only run tests in `assets/js/test-unit/`
- **Playwright (E2E Tests)**: Configured with `testDir: './tests/e2e'` in `playwright.config.js`

This prevents Jest from attempting to run Playwright tests and vice versa.

## Best Practices

1. **Run Tests Locally**: Always run `npm test` and `npm run test:e2e` before pushing
2. **Keep Tests Fast**: Unit tests should complete in seconds, e2e tests in minutes
3. **Fix Failing Tests Immediately**: Don't let broken tests accumulate
4. **Update Documentation**: Keep this file updated when workflows change
5. **Monitor CI Costs**: E2E tests with browsers can be expensive; optimize as needed

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Stencil CLI Documentation](https://developer.bigcommerce.com/docs/storefront/stencil/cli)
