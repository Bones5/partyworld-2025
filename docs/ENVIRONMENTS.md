# Multi-Environment Setup

This project supports multiple BigCommerce store environments (staging, production, etc.) with easy switching.

## Quick Reference

```bash
# Switch environments
npm run env:staging      # Switch to staging store
npm run env:prod         # Switch to production store
npm run env:list         # List all environments
npm run env:current      # Show current environment

# Start with specific environment
npm run start:staging    # Switch to staging + start Stencil
npm run start:prod       # Switch to production + start Stencil
npm run start            # Start with current environment
```

## Setup

### 1. Initialize Environment Configs

```bash
npm run env:init
```

This creates template files in `/environments/`:
- `staging.config.json` - Staging store URL and settings
- `staging.secrets.json` - Staging API token (gitignored)
- `production.config.json` - Production store URL and settings
- `production.secrets.json` - Production API token (gitignored)

### 2. Configure Your Stores

Edit `environments/staging.config.json`:
```json
{
  "normalStoreUrl": "https://your-staging-store.mybigcommerce.com/",
  "port": 3000
}
```

Edit `environments/staging.secrets.json`:
```json
{
  "accessToken": "your-staging-api-token"
}
```

Repeat for `production.config.json` and `production.secrets.json`.

### 3. Get API Tokens

1. Go to your BigCommerce admin → Settings → API Accounts
2. Create a new API account with:
   - **OAuth Scopes**: Store Content (read-only minimum)
   - **Token Type**: Legacy V2/V3 API Token
3. Copy the Access Token to your secrets file

## How It Works

The `env-switch.js` script:
1. Reads the selected environment config from `/environments/`
2. Writes to `config.stencil.json` and `secrets.stencil.json` in the root
3. These root files are gitignored and used by Stencil CLI

## Adding More Environments

Create new config files:
```
environments/
├── staging.config.json
├── staging.secrets.json
├── production.config.json
├── production.secrets.json
├── qa.config.json          # Add more environments
└── qa.secrets.json
```

Then switch with:
```bash
node scripts/env-switch.js qa
```

## Security Notes

- **Never commit** `*.secrets.json` files (they're gitignored)
- **Safe to commit** `*.config.json` files (no sensitive data)
- Root `config.stencil.json` and `secrets.stencil.json` are also gitignored

## Image Transfer Between Environments

See `scripts/image-transfer/README.md` for transferring product images between stores.

Quick example:
```bash
npm run images:transfer -- \
  --from staging \
  --to production \
  --csv ./products.csv \
  --bucket s3://bucket/path \
  --public-url https://cdn.example.com
```
