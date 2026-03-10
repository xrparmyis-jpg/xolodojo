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
- Optional: set `VITE_WALLETCONNECT_CONNECT_TIMEOUT_MS` (default `60000`) to tune how long the app waits for wallet signing before showing a timeout.

## Development

- `npm run dev:full` - Start both API server and frontend
- `npm run dev` - Frontend only (port 5173)
- `npm run dev:api` - API server only (port 3000)

## Pre-push checks

- `npm run preflight` - Fast deploy-safety check (TypeScript build checks)
- `npm run preflight:strict` - Strict lint + build
- `npm run hooks:install` - Install repo-managed Git hooks (`pre-push` runs `npm run preflight`)

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express (local) / Vercel Serverless (production)
- **Database:** MySQL (Docker for local, Hostinger for production)
- **Auth:** Auth0
