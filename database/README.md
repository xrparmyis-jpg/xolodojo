# Database Setup

## Wallet Migration Files

- Local Docker/MySQL: `database/migrations/wallet_routines_local.sql`
- Hostinger/live (optional): `database/migrations/wallet_routines_hostinger.sql`

## Xglobe saved pins (bookmarks)

Apply once per environment (local Docker or production DB). Without it, `/api/user/saved-globe-pins` returns **500**.

```bash
docker exec -i donovan-db mysql -udonovan_user -pdonovan_password donovan_db < database/migrations/20260422_globe_pin_bookmarks.sql
```

Or from the host: `mysql -h 127.0.0.1 -P 3308 -u donovan_user -p donovan_db < database/migrations/20260422_globe_pin_bookmarks.sql`

Companion handoff doc: `WALLET_SETUP.md`

## Quick Start

### 1. Start Local Database (Docker)

```bash
docker-compose up -d
```

Wait a few seconds for MySQL to be ready.

### 2. Create Database Schema

```bash
# Run the schema file (MySQL)
docker exec -i donovan-db mysql -udonovan_user -pdonovan_password donovan_db < database/schema.sql
```

### 3. Verify Database

```bash
# Connect to database
docker exec -it donovan-db mysql -udonovan_user -pdonovan_password donovan_db

# List tables
SHOW TABLES;

# Exit
exit
```

## Database Connection

**Local Development:**

- Host: `localhost`
- Port: `3308` (MySQL)
- Database: `donovan_db`
- User: `donovan_user`
- Password: `donovan_password`

**Production (Hostinger):**

- Update environment variables in Vercel with Hostinger credentials
- Use backend API to connect (never connect directly from frontend)

## Useful Commands

```bash
# View database logs
docker logs donovan-db

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v

# Restart database
docker-compose restart

# Check if database is running
docker ps | grep donovan-db
```
