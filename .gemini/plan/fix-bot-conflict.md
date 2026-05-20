# Plan: Resolve Telegram Bot 409 Conflict

## Problem
The user is experiencing a `409 Conflict` error: "terminated by other getUpdates request". This is caused by multiple instances of the bot (same token) polling Telegram simultaneously.

## Root Causes Identified
1.  **Local vs. Cloud**: User running the bot locally (via Docker as recommended in the guide) while the Render deployment is also active.
2.  **Render Deployment Overlap**: Render's zero-downtime deployment (rolling update) starts the new instance before the old one is killed, causing a temporary conflict.
3.  **Procfile Overlap**: If Render starts both `web` and `worker` processes from the `Procfile`, and both start the bot (though my research suggests only `web` starts the main loop).

## Proposed Solution
1.  **Update `docs/deployment-guide.md`**:
    *   Add a warning in the "Local Testing" section: "DO NOT run the bot locally while it is also live on Render."
    *   Add a "Troubleshooting" section specifically for `409 Conflict`.
    *   Explain how to stop local Docker containers.
2.  **Enhance `src/bot/index.js` (Optional but good)**:
    *   The bot already has a health-check server. I could add an environment variable `USE_WEBHOOK` to allow switching easily, but for now, I'll stick to clarifying the polling conflict.

## Steps
1.  Update `docs/deployment-guide.md` with the identified warnings and troubleshooting steps.
2.  Verify the `Procfile` again to ensure the `worker` process doesn't inadvertently start a polling loop (it doesn't, but I'll double-check the code of `scripts/run-cron.js`).
3.  Provide the user with clear instructions to resolve the immediate error.

## Verification
- Review the updated documentation for clarity.
- Confirm the `worker` process command in `Procfile` is safe.
