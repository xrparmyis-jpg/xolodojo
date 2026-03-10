# Setup Guide

Follow these steps to get the project running locally.

## Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Docker** - [Download](https://www.docker.com/get-started)
- **Git**

## Quick Start

### Wallet Routine Update (new)

If you're pulling the wallet connection changes, follow `WALLET_SETUP.md` after install.

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd react
npm install
```

If you only need wallet table updates on an existing setup, use:

```bash
docker exec -i donovan-db mysql -udonovan_user -pdonovan_password donovan_db < database/migrations/wallet_routines_local.sql
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

The `.env.local` file should already have the correct local database credentials:

```
DB_HOST=localhost
DB_PORT=3308
DB_NAME=donovan_db
DB_USER=donovan_user
DB_PASSWORD=donovan_password
```

**Note:** You'll also need Auth0 credentials. Ask your partner for the Auth0 values or check your Auth0 dashboard.

### 3. Start the Database

```bash
docker-compose up -d
```

This starts a MySQL database in Docker on port 3308.

### 4. Create Database Tables

```bash
# Wait a few seconds for MySQL to be ready, then run:
docker exec -i donovan-db mysql -udonovan_user -pdonovan_password donovan_db < database/schema.sql
```

### 5. Start the Development Servers

**Option A: Run both servers together (recommended)**

```bash
npm run dev:full
```

**Option B: Run servers separately**

```bash
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Frontend Server
npm run dev
```

### 6. Access the App

- Frontend: http://localhost:5173
- API Server: http://localhost:3000

## Troubleshooting

### Port 3000 Already in Use

If you get an error that port 3000 is in use:

```bash
# Option 1: Stop the process using port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use a different port
API_PORT=3001 npm run dev:api
```

Then update `vite.config.ts` to proxy to the new port.

### Database Connection Issues

```bash
# Check if database is running
docker ps | grep donovan-db

# View database logs
docker logs donovan-db

# Restart database
docker-compose restart
```

### Database Tables Missing

If you see database errors, make sure you ran the schema:

```bash
docker exec -i donovan-db mysql -udonovan_user -pdonovan_password donovan_db < database/schema.sql
```

## Project Structure

- `src/` - React frontend code
- `api/` - API routes (Vercel serverless functions)
- `server.ts` - Local Express server for API routes
- `database/` - Database schema and setup files
- `docker-compose.yml` - Docker configuration for local MySQL

## Available Scripts

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run dev:api` - Start Express API server (backend only)
- `npm run dev:full` - Start both servers together
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

**Local Development (.env.local):**

- Uses Docker MySQL database (localhost:3308)
- Auth0 credentials needed from Auth0 dashboard
- WalletConnect requires `VITE_WALLETCONNECT_PROJECT_ID`
- Optional WalletConnect chain list: `VITE_WC_CHAIN_IDS` (comma-separated chain IDs, default `1`)
- Optional WalletConnect timeout override: `VITE_WALLETCONNECT_CONNECT_TIMEOUT_MS` (milliseconds, default `60000`)

**Production (Vercel):**

- Uses Hostinger MySQL database
- Set environment variables in Vercel dashboard

## Need Help?

If you run into issues:

1. Check that Docker is running: `docker ps`
2. Check that ports 3000 and 5173 are available
3. Verify `.env.local` exists and has correct values
4. Check the terminal output for error messages
