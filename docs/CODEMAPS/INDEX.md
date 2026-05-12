# Codemaps Index

**Last Updated:** 2025-05-22

Overview of the ZBNF Farming Assistant codebase structure.

## Areas

- [P1 — Farm Scheduler](./p1-scheduler.md) - Plot registration and ZBNF reminders.
- [P2 — Weather Alert](./p2-weather-alert.md) - Weather-based irrigation and spray advisories.
- [P3 — Krishi Record](./p3-krishi-record.md) - Offline PWA for farm record keeping.
- [P4 — IoT Soil Monitoring](./p4-iot-monitoring.md) - Real-time soil data and alerts.
- [P5 — Plant Disease Detection](./p5-disease-detection.md) - Photo-based disease ID and ZBNF treatment.
- [P6 — ZBNF Knowledge](./p6-zbnf-knowledge.md) - Offline formulation calculators and pest gallery.
- [Shared Foundation](../architecture.md) - Database, logging, and bot infrastructure.

## System Overview

The project is structured as a collection of modular applications and services.

### Backend/Bot (Node.js)
```
src/
├── bot/                # Telegram bot commands and scenes
├── config/             # Configuration and logger
├── db/                 # Database connection and schema
├── scheduler/          # Cron jobs and reminder engine
├── services/           # Business logic and external integrations
└── scripts/            # Utility scripts
```

### Frontend (React PWAs)
```
krishi-record/          # P3: Farm Record Tracker
├── src/
│   ├── components/     # UI Components
│   ├── db/             # IndexedDB Schema
│   └── utils/          # Calculations & Utils

disease-detect/         # P5: Plant Disease Detection
├── src/
│   ├── components/     # UI Components
│   ├── services/       # API & TF.js services
│   └── data/           # Treatment knowledge base

zbnf-knowledge/         # P6: ZBNF Knowledge Base
├── src/
│   ├── pages/          # Calculator, Pest Gallery, Calendar
│   ├── data/           # Pests, Crops, Glossary JSON
│   └── utils/          # Formula business logic
```

### IoT & Infrastructure
```
firmware/               # P4: ESP32 Arduino C++ code
flows/                  # Node-RED JSON flows
grafana/                # Grafana dashboard exports
```
