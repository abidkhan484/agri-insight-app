# ZBNF Farming Assistant — Deployment Guide (Free Tier)

This guide outlines the zero-cost deployment strategy using **Render**, **GitHub Pages**, and **Supabase**.

## 🚀 Deployment Strategy Overview

| Component                 | Platform                  | Cost | Always On?            |
| :------------------------ | :------------------------ | :--- | :-------------------- |
| **Core Telegram Bot**     | **Render (Web Service)**  | $0   | No (Sleeps after 15m) |
| **Database**              | **Supabase (PostgreSQL)** | $0   | Yes                   |
| **Agriculture Assistant** | **GitHub Pages**          | $0   | Yes                   |

---

## 📋 Preparation Checklist (Inputs Needed From You)

All required configuration variables are listed in the **root `.env.example`** file. Before starting, please gather the following credentials:

1.  **Telegram Bot Token**: Get it from [@BotFather](https://t.me/botfather).
2.  **Supabase Project**:
    - Sign up at [supabase.com](https://supabase.com).
    - Create a project and get the `Project URL`, `Anon Key`, and `Service Role Key`.
3.  **PlantNet API Key**: (Optional) Get it at [my.plantnet.org](https://my.plantnet.org/) for the Disease Detection app.

---

## 1. Database Setup (Supabase)

Render's free tier has no persistent storage. The bot has been migrated to use Supabase (PostgreSQL) to ensure your data is safe even when the service sleeps.

1.  Go to your Supabase **SQL Editor**.
2.  Run the **entire content** of the schema setup script found in `src/db/schema.sql`.
3.  This script will automatically:
    - Enable the **PostGIS** extension.
    - Create all tables for the Bot and the Map.
    - Set up **Row Level Security (RLS)** for the public map and FAQ data.

---

## 2. Environment Configuration

We use a single root `.env.example` to manage settings for all services.

- **For Local Development**: Copy `.env.example` to `.env` and fill in the values.
- **For Production**: Use the variables defined in `.env.example` to populate your Render Environment Variables and GitHub Secrets.

---

## 3. Core Telegram Bot (Render)

1.  Create a new **Web Service** on [Render](https://render.com).
2.  Connect your GitHub repository.
3.  Render will automatically detect the `Dockerfile`.
4.  **Environment Variables**:
    - `BOT_TOKEN`: Your Telegram Token.
    - `VITE_SUPABASE_URL`: Your Supabase Project URL.
    - `SUPABASE_SERVICE_KEY`: Your Supabase **Service Role Key** (required for backend bypass).
    - `NODE_ENV`: `production`
    - `TZ`: `Asia/Dhaka`
    - `AI_API_URL`: (Optional) URL of your AI Assistant if deployed.

---

## 4. Agriculture Assistant PWA (GitHub Pages)

The four previous frontends (Krishi Record, Disease Detection, Knowledge Base, and Farmer Map) have been consolidated into a single application in the `client/` directory.

### 🔐 GitHub Actions Secrets

Since this is a static site, environment variables are baked in at build time. You **must** add the following to your GitHub Repo **Settings > Secrets and variables > Actions**:

- `VITE_SUPABASE_URL`: Your Supabase URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
- `VITE_PLANTNET_API_KEY`: (Optional) Your PlantNet API Key.
- `VITE_AUTH_ENDPOINT`: The URL of your bot's auth endpoint (e.g., `https://agri-insight-app.onrender.com/api/auth/telegram`).

### Automatic Deployment

I have updated the GitHub Action (`.github/workflows/deploy-pwas.yml`) to build and deploy the unified app automatically whenever you push to `main`.

> [!IMPORTANT]
> **Manual Step Required**: You must go to your GitHub repository **Settings > Pages** and set the **Source** to **"GitHub Actions"**. If it is set to "Deploy from a branch", the workflow will fail or get stuck.

### URL:

`https://<username>.github.io/insight-app/`

---

## 5. Client Docker Deployment (Alternative)

If you wish to host the client yourself (e.g., on a VPS or Render as a static site with Nginx):

1.  Navigate to the `client` directory: `cd client`
2.  Build the Docker image:
    ```bash
    docker build -t agri-assistant-client .
    ```
3.  Run the container:
    ```bash
    docker run -p 8080:80 agri-assistant-client
    ```
    _The app will be available at http://localhost:8080_

---

## 5a. Docker Build Best Practices (Render / x64 Linux)

This section documents the correct approach for production Docker builds on Render.com (x64 Linux) following a build failure that was diagnosed and fixed.

### ✅ Use `npm ci --omit=dev --ignore-scripts`

The `Dockerfile` uses the following command to install dependencies inside the image:

```bash
npm ci --omit=dev --ignore-scripts
```

| Flag               | Why it matters                                                                                                                                                                  |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`           | Installs exactly what is in `package-lock.json`. Fails fast if the lock file is out of sync — safe for CI/CD.                                                                   |
| `--omit=dev`       | Excludes all `devDependencies` (vitest, eslint, prettier, husky, etc.) — keeps the production image lean.                                                                       |
| `--ignore-scripts` | Suppresses lifecycle scripts (`prepare`, `postinstall`, etc.). Without this, the husky `prepare` hook fires inside Docker where there is no git repository, crashing the build. |

> [!WARNING]
> **`--frozen-lockfile` is a Yarn flag — it is not valid for npm.** Using it causes `npm install` to error with an unrecognised option. Always use `npm ci` (not `npm install --frozen-lockfile`) in npm projects.

### ⚠️ Never add platform-specific native bindings to production `dependencies`

Dev tools such as `vitest` and `rolldown` ship with optional platform-specific native bindings (e.g. `@rolldown/binding-linux-arm64-gnu`). These are fine as transitive `optionalDependencies` of your dev tools, but must **never** appear directly in production `dependencies`.

- ARM64 bindings (`*-arm64-*`) are incompatible with Render's x64 Linux runners and will cause the Docker build to fail at install time.
- If you accidentally add one, remove it from `dependencies` in `package.json` and run `npm install` locally to update `package-lock.json`.

```diff
 // package.json
 "dependencies": {
-  "@rolldown/binding-linux-arm64-gnu": "1.0.0-beta.x",
   "telegraf": "..."
 }
```

### Summary of the production Dockerfile install step

```dockerfile
# Install only production dependencies, skip lifecycle hooks
RUN npm ci --omit=dev --ignore-scripts
```

---

## 6. Keeping the Bot "Alive"

Since Render sleeps after 15 minutes, the first message to the bot after a break might take 30 seconds to respond.

To keep it active during farming hours (6 AM - 10 PM BDT), a GitHub Action `daily-cron.yml` is staged at `github_workflow/workflows/daily-cron.yml`. It is intentionally not deployed to `.github/workflows/` yet — copy it there when ready to activate:

```bash
cp github_workflow/workflows/daily-cron.yml .github/workflows/daily-cron.yml
```

---

## 💻 Local Testing & Development

Before deploying to the cloud, you can test everything on your local machine.

### 1. Prerequisites

- **Node.js**: v24 or newer.
- **Git**: To clone and manage the repo.

### 2. Environment Setup

1.  Copy the example file to a real `.env` file:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and fill in your **Telegram Bot Token** and **Supabase Credentials**.

### 3. Run the Telegram Bot (Using Docker - Recommended)

Testing with Docker ensures your local environment perfectly matches the production environment on Render.

> [!WARNING]
> **DO NOT** run the bot locally (Docker or NPM) while it is also live on Render. Telegram only allows **one instance** to poll for updates at a time. Running both will cause a `409 Conflict` error.

1.  **Build the Docker image**:
    ```bash
    docker build -t agri-bot .
    ```
    The `Dockerfile` runs `npm ci --omit=dev --ignore-scripts` internally. See [§ 5a](#5a-docker-build-best-practices-render--x64-linux) for details on why those flags are required.
2.  **Run the container**:
    ```bash
    docker run --env-file .env agri-bot
    ```
    _The bot will start up and use the credentials provided in your root `.env` file._

### 4. Run the Telegram Bot (Using NPM - Alternative)

Best for rapid development and debugging without rebuilding images.

1.  Navigate to the `src` directory: `cd src`
2.  Install and start:
    ```bash
    npm install
    npm start
    ```

### 5. Run the Agriculture Assistant (Frontend)

The unified PWA is built with Vite and should be tested with `npm`.

1.  Navigate to the `client` folder: `cd client`
2.  Install and run:
    ```bash
    npm install
    npm run dev
    ```
3.  Open `http://localhost:5173` in your browser.

---

## 🛠️ Troubleshooting

### ❌ Error: `409 Conflict: terminated by other getUpdates request`

This means multiple instances of your bot are running with the same `BOT_TOKEN`.

**Solution:**

1.  **Stop Local Instances**: If you are running the bot in a terminal or Docker container locally, stop it (`Ctrl+C` or `docker stop`).
2.  **Check Render Services**: Go to your Render Dashboard and ensure you don't have multiple services (e.g., a Web Service and a Background Worker) both trying to run the bot.
3.  **Deployment Overlap**: During a new deployment, Render starts the new version before killing the old one. This might cause a brief conflict for 30-60 seconds. It will resolve itself once the old version is fully terminated.

---

## ❌ Skipped Components (As Requested)

- **P7 Local AI Assistant**: High resource needs; keep local.
- **P4 IoT Soil Monitoring**: Requires hardware + dedicated MQTT broker.
