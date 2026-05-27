# Local Development Setup

This repo is local-first. We do not maintain a BigCommerce staging store for this theme, and the default workflow is to run Stencil locally against a single configured store.

## Quick Reference

```bash
# Configure the default store
npm run env:init         # Create the production config template
npm run env:prod         # Copy production store credentials into the root stencil files
npm run env:list         # List all configured environments
npm run env:current      # Show the active environment

# Start local development
npm run start            # Start Stencil with the current config
npm run start:prod       # Switch to production config + start Stencil
```

## Default Setup

### 1. Initialize the Store Config

```bash
npm run env:init
```

This creates the default files in `/environments/`:

- `production.config.json` - Store URL and Stencil settings
- `production.secrets.json` - Store API token (gitignored)

### 2. Configure the Store Used for Local Development

Edit `environments/production.config.json`:

```json
{
  "normalStoreUrl": "https://your-production-store.mybigcommerce.com/",
  "port": 3000
}
```

Edit `environments/production.secrets.json`:

```json
{
  "accessToken": "your-production-api-token"
}
```

### 3. Get an API Token

1. Go to your BigCommerce admin → Settings → API Accounts
2. Create a new API account with:
   - **OAuth Scopes**: Store Content (read-only minimum)
   - **Token Type**: Legacy V2/V3 API Token
3. Copy the access token into `environments/production.secrets.json`

### 4. Start the Local Storefront

```bash
npm run env:prod
npm start
```

## How It Works

The `env-switch.js` script:

1. Reads the selected environment config from `/environments/`
2. Writes to `config.stencil.json` and `secrets.stencil.json` in the repo root
3. Leaves the checked-in config templates untouched while Stencil CLI uses the generated root files locally

## Additional Environments

The repo no longer advertises staging as a standard workflow. If you truly need an extra environment, create matching files manually:

```text
environments/
├── production.config.json
├── production.secrets.json
├── qa.config.json
└── qa.secrets.json
```

Then switch with:

```bash
node scripts/env-switch.js qa
```

## Security Notes

- **Never commit** `*.secrets.json` files; they are gitignored
- **Safe to commit** `*.config.json` files; they contain no secrets
- Root `config.stencil.json` and `secrets.stencil.json` are also gitignored
