# Xolo Dojo

React + Vite frontend with Auth0 authentication and MySQL database.

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

**TL;DR:**
```bash
npm install
cp .env.example .env.local  # Add your Auth0 credentials
docker-compose up -d
docker exec -i donovan-db mysql -udonovan_user -pdonovan_password donovan_db < database/schema.sql
npm run dev:full
```

Visit http://localhost:5173

### WalletConnect note

- Set `VITE_WALLETCONNECT_PROJECT_ID` in `.env.local` to enable WalletConnect wallets.
- Browser-injected wallets (MetaMask/Trust/etc.) are disabled by default; set `VITE_WC_ENABLE_INJECTED=true` only when intentionally testing them.
- Optional: set `VITE_WC_CHAIN_IDS` (default `1`) to control which EVM chains are requested in the WalletConnect session.

## Development

- `npm run dev:full` - Start both API server and frontend
- `npm run dev` - Frontend only (port 5173)
- `npm run dev:api` - API server only (port 3001)

## Tests

Shared helpers live under `tests/helpers/` (env load, test users, Supabase clients, credential seed).

```bash
npm run test:unit                 # Vitest unit tests (no DB)
npm run test:integration          # Vitest + Supabase RLS (phase 2, skipped)
npm run auth:seed-test-credentials
npm run test:e2e                  # Playwright (reuses npm run dev:full if already running)
# npm run test:e2e:install        # only if Chromium is missing from ~/.cache/ms-playwright
```

Auth/e2e prereqs: `.env.local` with Supabase URL + anon + service role keys, then seed passwords. Sign-in UI: Get Started → XoloDojo Account.

`@playwright/test` is pinned to **1.53.2** so it reuses the existing cached Chromium (no CDN download). If you bump Playwright later, you must re-run `test:e2e:install` or switch the config to `channel: 'chrome'` / `'msedge'` (system browser, no Playwright download).

## Pre-push checks

- `npm run preflight` - Fast deploy-safety check (TypeScript build checks)
- `npm run preflight:strict` - Strict lint + build
- `npm run hooks:install` - Install repo-managed Git hooks (`pre-push` runs `npm run preflight`)

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express (local) / Vercel Serverless (production)
- **Database:** MySQL (Docker for local, Hostinger for production)
- **Auth:** Auth0
