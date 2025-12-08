# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the Partyworld 2025 theme.

## Workflows

### update-branches-on-merge.yml
**Purpose**: Automatically updates all feature branches with the latest changes from master when a PR is merged.

**Trigger**: Runs when a pull request is merged (not just closed) to the `master` branch.

**Behavior**:
- Fetches all remote branches
- For each branch (except master):
  - Attempts to merge master into the branch
  - If successful, pushes the updated branch
  - If merge conflicts exist, skips the branch and logs a warning
- Provides a summary of updated, skipped, and failed branches

**Configuration**:
- By default, uses `GITHUB_TOKEN` for authentication
- To update protected branches, replace with a Personal Access Token (PAT):
  - Create a PAT with `repo` permissions
  - Add it as a repository secret (e.g., `PAT_TOKEN`)
  - Update the workflow: `token: ${{ secrets.PAT_TOKEN }}`

**Notes**:
- Branches with merge conflicts will need to be updated manually
- The workflow uses `github-actions[bot]` as the commit author
- Fast-forward merges are performed when possible to avoid unnecessary merge commits

**Benefits**:
- Keeps feature branches up-to-date with master
- Reduces merge conflicts when feature branches are eventually merged
- Saves developers time from manually updating branches

### playwright.yml
**Purpose**: Runs Playwright end-to-end tests to validate design system implementation.

**Trigger**: Runs on push to `main`/`develop` branches and on pull requests targeting those branches.

**Note**: This workflow uses `main`/`develop` branches, while other workflows use `master`. This reflects different configuration patterns in the repository.

### pull_request_review.yml
**Purpose**: Validates that the theme can be successfully bundled using Stencil CLI.

**Trigger**: Runs on pull requests and pushes to `master`/`main` branches.
