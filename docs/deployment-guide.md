# ZBNF Farming Assistant — Deployment Guide (Free Tier)

This guide outlines the zero-cost deployment strategy using **Render**, **GitHub Pages**, and **Supabase**.

## 🚀 Deployment Strategy Overview

| Component             | Platform                  | Cost | Always On?            |
| :-------------------- | :------------------------ | :--- | :-------------------- |
| **Core Telegram Bot** | **Render (Web Service)**  | $0   | No (Sleeps after 15m) |
| **Database**          | **Supabase (PostgreSQL)** | $0   | Yes                   |
| **All 4 PWAs**        | **GitHub Pages**          | $0   | Yes                   |

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

## 4. PWAs (GitHub Pages)

We deploy all 4 frontends to your GitHub Pages site in subdirectories.

### 🔐 GitHub Actions Secrets
Since these are static sites, environment variables are baked in at build time. You **must** add the following to your GitHub Repo **Settings > Secrets and variables > Actions**:
*   `VITE_SUPABASE_URL`: Your Supabase URL.
*   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
*   `VITE_PLANTNET_API_KEY`: (Optional) Your PlantNet API Key.

### Automatic Deployment
I have created a GitHub Action (`.github/workflows/deploy-pwas.yml`) that builds and deploys these apps automatically whenever you push to `main`.

### URLs will look like:

- `https://<username>.github.io/insight-app/krishi-record/`
- `https://<username>.github.io/insight-app/disease-detect/`
- `https://<username>.github.io/insight-app/zbnf-knowledge/`
- `https://<username>.github.io/insight-app/map-pwa/`

**Note**: You must go to your Repo **Settings > Pages** and set the source to **GitHub Actions**.

---

## 4. Keeping the Bot "Alive"

Since Render sleeps after 15 minutes, the first message to the bot after a break might take 30 seconds to respond.

To keep it active during farming hours (6 AM - 10 PM BDT), the included GitHub Action `daily-cron.yml` can be configured to "ping" your Render URL once a day or more.

---

## 💻 Local Testing & Development

Before deploying to the cloud, you can test everything on your local machine.

### 1. Prerequisites
- **Node.js**: v20 or newer.
- **Git**: To clone and manage the repo.

### 2. Environment Setup
1.  Copy the example file to a real `.env` file:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and fill in your **Telegram Bot Token** and **Supabase Credentials**.

### 3. Run the Telegram Bot (Using Docker - Recommended)
Testing with Docker ensures your local environment perfectly matches the production environment on Render.

1.  **Build the Docker image**:
    ```bash
    docker build -t agri-bot .
    ```
2.  **Run the container**:
    ```bash
    docker run --env-file .env agri-bot
    ```
    *The bot will start up and use the credentials provided in your root `.env` file.*

### 4. Run the Telegram Bot (Using NPM - Alternative)
Best for rapid development and debugging without rebuilding images.

1.  Navigate to the `src` directory: `cd src`
2.  Install and start:
    ```bash
    npm install
    npm start
    ```

### 5. Run the PWAs (Frontend)
Each PWA is built with Vite and should be tested with `npm` for hot-reloading.

1.  Navigate to a PWA folder (e.g., `cd krishi-record`).
2.  Install and run:
    ```bash
    npm install
    npm run dev
    ```
3.  Open `http://localhost:5173` in your browser.

---

## ❌ Skipped Components (As Requested)

- **P7 Local AI Assistant**: High resource needs; keep local.
- **P4 IoT Soil Monitoring**: Requires hardware + dedicated MQTT broker.
