---
title: "P4 — IoT Soil Monitoring"
weight: 40
bookFlatSection: true
---

> Works with: Claude Code, Codex CLI, Cursor, Gemini CLI

**Skill file:** `skills/p4-iot-soil-monitoring/SKILL.md` — read this before implementing
**Agent workflow:** coder → qa → reviewer → doc-updater → committer

# 🌡️ P4 — Low-Cost IoT Soil Monitoring (Tool E)

## Objective

Build a hardware + software system using ESP32 + capacitive soil moisture sensor + DHT22 for real-time soil data with MQTT pipeline, Grafana dashboards, and Telegram alerts enforcing ZBNF Whapasa thresholds.

## Prerequisites

- **P0** completed (Telegram bot for alerts)
- **P3** completed (data model reference)
- Hardware: ESP32, capacitive soil moisture sensor, DHT22, jumper wires, breadboard
- Arduino IDE with ESP32 board support

## Subtasks

### Phase 1: ESP32 Firmware

- [x] Set up Arduino IDE with ESP32 board package
- [x] Wire capacitive soil moisture sensor (analog) + DHT22 (digital + 10kΩ pull-up)
- [x] Write firmware (`firmware/soil_monitor.ino`): read sensors, connect WiFi, publish MQTT every 5 min
- [x] MQTT topic: `farm/{plot_id}/sensors` with JSON payload `{moisture, temp, humidity, ts}`
- [x] Add deep sleep between readings to conserve battery
- [x] Calibrate moisture: dry soil = 0%, water = 100%

### Phase 2: MQTT Broker

- [x] Dev: Use HiveMQ public broker (`broker.hivemq.com:1883`)
- [x] Prod: Set up Mosquitto on Raspberry Pi with authentication
- [x] Document topic naming: `farm/{plot_id}/sensors`, `farm/{plot_id}/alerts`, `farm/{plot_id}/config`

### Phase 3: Node-RED Data Processing

- [x] Install Node-RED, create flow subscribing to `farm/+/sensors`
- [x] Evaluate Whapasa thresholds: <30% dry, 30-40% getting dry, 40-70% ideal, 70-80% wet, >80% waterlogged
- [x] Send alerts to Telegram bot, forward data to InfluxDB/Grafana
- [x] Export flow as `flows/soil-monitoring.json`

### Phase 4: Grafana Dashboard

- [x] Set up Grafana + InfluxDB data source
- [x] Panels: real-time moisture gauge, 24h trend line, temp/humidity chart, alert history table
- [x] Per-plot selector dropdown, export dashboard JSON

### Phase 5: Telegram Alert Integration

- [x] Format alerts with emoji + plot name + reading + recommendation
- [x] Alert cooldown: no duplicate alert type per plot within 2 hours
- [x] Add `/soilstatus` and `/setthreshold` commands to bot

### Phase 6: Field Deployment Docs

- [x] Document waterproof enclosure build
- [x] Document solar power setup (5V panel → TP4056 → 18650 → ESP32)
- [x] Field deployment checklist

## Acceptance Criteria

- [x] ESP32 publishes sensor data every 5 min via MQTT
- [x] Node-RED evaluates thresholds and fires Telegram alerts correctly
- [x] Grafana dashboard shows real-time + historical data
- [x] Alert cooldown prevents duplicate alerts within 2 hours
- [x] System runs 24+ hours unattended
- [x] Winston logger in `/soilstatus` bot command — no `console.log`
- [x] Node-RED alert messages include Bangla (primary) + English (secondary) text
- [x] ESP32 WiFi credentials in Arduino build flags — NOT committed to source
- [x] `docs/architecture.md` updated with IoT data flow diagram

## Estimated Effort

⏱️ **3–5 days**

## Dependencies

| Dependency | Status |
|---|---|
| P0 — Shared Foundation | Must be completed |
| P3 — Farm Record Tracker | Recommended |
| Hardware procurement | Required before Phase 1 |
