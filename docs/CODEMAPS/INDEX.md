# Codemaps Index

**Last Updated:** 2024-05-08

Overview of the ZBNF Farming Assistant codebase structure.

## Areas

- [P1 — Farm Scheduler](./p1-scheduler.md) - Plot registration and ZBNF reminders.
- [P2 — Weather Alert](./p2-weather-alert.md) - Weather-based irrigation and spray advisories.
- [Shared Foundation](../architecture.md) - Database, logging, and bot infrastructure.

## System Overview

The project is structured as a single Node.js application (currently) with modules for different phases.

```
src/
├── bot/                # Telegram bot commands and scenes
├── config/             # Configuration and logger
├── db/                 # Database connection and schema
├── scheduler/          # Cron jobs and reminder engine
├── services/           # Business logic and external integrations
└── scripts/            # Utility scripts
```
