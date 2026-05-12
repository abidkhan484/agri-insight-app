# P4 — IoT Soil Monitoring Codemap

**Last Updated:** 2025-05-15
**Entry Points:** `firmware/soil_monitor.ino`, `src/bot/commands/soilstatus.js`

## Architecture

```
ESP32 (Sensors) --(MQTT)--> HiveMQ Broker --(MQTT)--> Node-RED
                                                        |
      +-------------------------------------------------+
      |                        |                        |
Whapasa Evaluation        InfluxDB Store        Telegram Alert
(flows/soil-monitoring.json)    |                (Node-RED Node)
                               ▼                        |
                        Grafana Dashboard               |
                                                        ▼
                                                 Farmer's Telegram
```

## Key Modules

| Module | Purpose | Key Components |
|--------|---------|----------------|
| `firmware/soil_monitor.ino` | ESP32 Firmware | Sensor reading, WiFi/MQTT client, Deep sleep |
| `flows/soil-monitoring.json` | Node-RED Flow | Whapasa logic, InfluxDB pipe, Alert formatter |
| `grafana/soil-monitoring-dashboard.json` | Visualisation | Real-time & Historical soil moisture panels |
| `src/bot/commands/soilstatus.js` | Bot Command | `/soilstatus` implementation with SQLite cache |

## Data Flow

1. **Sensor to Cloud**: ESP32 wakes up every 5 mins -> Reads Moisture/Temp/Hum -> Publishes JSON to `farm/{plot_id}/sensors`.
2. **Processing**: Node-RED receives MQTT -> Parses JSON -> Checks if moisture falls below 30% (Critically Dry) or rises above 80% (Waterlogged) -> Sends immediate alert via Telegraf/HTTP to Farmer.
3. **Storage**: Node-RED writes every reading to InfluxDB for historical analysis and Grafana display.
4. **Cache**: Node-RED also updates the `soil_readings` table in the Bot's SQLite database for quick `/soilstatus` retrieval.
5. **Retrieval**: User types `/soilstatus` -> Bot queries SQLite `soil_readings` -> Formats Bangla/English message with emojis.

## External Dependencies

- `PubSubClient` (Arduino) - MQTT client
- `DHT sensor library` (Arduino) - DHT22 driver
- `Node-RED` - Orchestration engine
- `InfluxDB` - Time-series database
- `Grafana` - Dashboarding

## Related Areas

- [P1 — Farm Scheduler](./p1-scheduler.md)
- [Architecture](../architecture.md)
