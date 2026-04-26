# Partner: local environment setup (xolodojo)

Use this checklist after pulling the latest branch. It matches the **session-based auth** stack (no Auth0): MySQL, Express API, Vite frontend, Nodemailer + optional local mail catcher.

---

## 1. Prerequisites

- **Node.js** 18+ and npm
- **Docker** (recommended for MySQL, same as repo `docker-compose.yml`)
- **MySQL client** (`mysql` CLI) to run the migration, *or* any GUI that can execute a `.sql` file against your DB

---

## 2. Install JavaScript dependencies

From the repo root:

```bash
npm install
```

This installs **`nodemailer`** (and everything else in `package.json`). There is no separate npm “mail app” to add for sending mail from the API; Nodemailer is already a dependency.

---

## 3. Start MySQL (Docker)

From the repo root:

```bash
docker compose up -d
```

Default mapping in this project: host **`127.0.0.1:3308`** → container MySQL `3306`. Wait until the container is healthy (or retry the migration step after ~10–20 seconds).

---

## 4. Create `.env.local`

Copy the example and then edit:

```bash
cp .env.example .env.local
```

**Before running the app**, fill in at least:

| Variable | Purpose |
|----------|---------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Must match Docker MySQL (see `docker-compose.yml`; port is often **`3308`** on the host). |
| `APP_PUBLIC_URL` | **Required for auth emails** (verify / reset links). Local dev: `http://localhost:5173` (no trailing slash). The API loads `.env.local` via `server.ts`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM` | See §6 (mail catcher). Optional `SMTP_USER` / `SMTP_PASS` if your SMTP needs auth. |
| Mapbox, Xaman, WalletConnect, Joey, etc. | As in `.env.example` / team secrets. |

You can remove any old **`VITE_AUTH0_*`** variables; they are unused.

Frontend API calls: leave `VITE_API_BASE_URL` empty for local dev so the Vite dev server proxies `/api` to the API (default **`http://localhost:3001`** when using `npm run dev:full`).

---

## 5. Run the database migration (destructive)

This migration **drops and recreates** user-related tables (`users`, sessions, profiles, wallets, pins). Use only on a disposable local DB or after a backup.

**Adjust** host/port/user/password/database if yours differ from Docker defaults.

```bash
mysql -h 127.0.0.1 -P 3308 -u donovan_user -p donovan_db < database/migrations/20260210_replace_auth0_with_session_auth.sql
```

When prompted, password is the one in `docker-compose.yml` (`donovan_password` in the template).

Sanity check:

```bash
mysql -h 127.0.0.1 -P 3308 -u donovan_user -p donovan_db -e "SHOW TABLES; DESCRIBE users;"
```

You should see `users` with columns like `email`, `username`, `password` (no `auth0_id`).

---

## 6. Local mail catcher (recommended for dev)

The API sends mail via **Nodemailer** using `SMTP_*`. For local dev, run a catcher on **`127.0.0.1:1025`** and point env at it.

**Option A — Mailpit (single binary)**  
Install from [Mailpit releases](https://github.com/axllent/mailpit) or your package manager, then run e.g. `mailpit` (default SMTP often `1025`, web UI often `8025`). Align `SMTP_PORT` in `.env.local` with Mailpit’s SMTP port.

**Option B — Mailpit via Docker** (if you prefer not to install the binary)

```bash
docker run -d --name mailpit -p 8025:8025 -p 1025:1025 axllent/mailpit
```

Example `.env.local` SMTP block for Mailpit:

```env
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=noreply@xolodojo.local
```

Open the web UI (e.g. `http://localhost:8025`) to read verification and password-reset emails.

---

## 7. Run the app

Terminal 1 +2, or one combined command:

```bash
npm run dev:full
```

- Frontend: `http://localhost:5173`  
- API: `http://localhost:3001` (Express in `server.ts`)

---

## 8. Smoke test

1. Open the site → **Register** / **Login** in the header.  
2. Complete registration → confirm email link (from Mailpit) if verification is required.  
3. Open **Profile** → wallets / pins as needed.

If emails never arrive, check `APP_PUBLIC_URL`, `SMTP_*`, and that the catcher is listening on the port you configured.

---

## Quick reference: files that matter

| Item | Location |
|------|----------|
| Migration SQL | `database/migrations/20260210_replace_auth0_with_session_auth.sql` |
| Docker MySQL | `docker-compose.yml` |
| API env load order | `server.ts` (`.env` then `.env.local` override) |
| Session cookie name | `xolodojo_session` (HTTP-only; set by API) |

---

## For AI assistants

- Do **not** invent Auth0 env vars; auth is cookie sessions + `/api/auth/*`.  
- After `git pull`, run **`npm install`**, ensure **`.env.local`** exists with **`APP_PUBLIC_URL`** and **DB + SMTP**, run **`docker compose up -d`** if using container MySQL, then apply the **migration SQL** above before **`npm run dev:full`**.
