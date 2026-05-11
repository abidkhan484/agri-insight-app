# Design Spec: Logging & Configuration

## 1. Objective
Implement a robust logging system and a centralized configuration loader for the ZBNF Farming Assistant.

## 2. Requirements
- **Logging:**
  - Library: Winston.
  - Files: `logs/error.log` (errors only), `logs/combined.log` (all logs).
  - Format: JSON for files, colorized simple for console.
  - Directory: Ensure `logs/` exists on startup.
- **Configuration:**
  - Library: `dotenv`.
  - Environment variables: `BOT_TOKEN`, `DB_PATH`, `TIMEZONE`, `LOG_LEVEL`, `NODE_ENV`.
  - Defaults:
    - `DB_PATH`: `./data/agri.sqlite`
    - `TIMEZONE`: `Asia/Dhaka`
    - `LOG_LEVEL`: `info`
    - `NODE_ENV`: `development`

## 3. Architecture
- `src/config/index.js`: Loads `.env` and exports the `config` object.
- `src/config/logger.js`: Configures and exports the Winston logger instance, importing `logLevel` from `src/config/index.js`.

## 4. Verification
- Verify `logs/` directory creation.
- Verify console output is colorized.
- Verify file logs are in JSON format.
- Verify environment variables override defaults.
