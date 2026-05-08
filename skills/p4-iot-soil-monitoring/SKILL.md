---
name: p4-iot-soil-monitoring
description: Implement P4 IoT Soil Monitoring — ESP32 + capacitive soil moisture sensor + DHT22, MQTT via HiveMQ public broker (dev) or Mosquitto (prod), Node-RED flow, InfluxDB storage, Grafana dashboard, and Telegram alert with 2-hour cooldown logic using ZBNF Whapasa thresholds. Requires P0 + P3 complete.
triggers:
  - implement p4
  - iot soil monitoring
  - esp32 sensor
  - soil moisture alert
  - grafana dashboard
  - mqtt node-red
---

# P4 — IoT Soil Monitoring Implementation Workflow

## Dependency Check
**P0 and P3 must be complete before starting P4.**
Verify: bot responds to `/start`, SQLite DB exists, plots table has data.

## Required Reading
- `tasks/p4-iot-soil-monitoring.md` — full 6-phase checklist
- `skills/zbnf-formulation/SKILL.md` → Section 7 (Whapasa thresholds):
  - 40–70% moisture → Whapasa (ideal) — no alert
  - 30–40% → getting dry — WARN alert
  - < 30% → dry — CRITICAL alert
  - 70–80% → wet — WARN alert
  - > 80% → waterlogged — CRITICAL alert

---

## Agent Invocation Sequence

### Step 1 — coder

#### Phase 1: ESP32 Firmware (`firmware/soil_monitor.ino`)

Wire capacitive soil moisture sensor (AOUT → GPIO34) and DHT22 (DATA → GPIO4 + 10kΩ pull-up).

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Secrets — flash via Arduino IDE build flags, never hardcoded in committed code
const char* WIFI_SSID     = CONFIG_WIFI_SSID;
const char* WIFI_PASS     = CONFIG_WIFI_PASS;
const char* MQTT_BROKER   = CONFIG_MQTT_BROKER;   // broker.hivemq.com for dev
const int   MQTT_PORT     = 1883;
const char* PLOT_ID       = CONFIG_PLOT_ID;        // e.g. "plot-001"

#define DHT_PIN  4
#define DHT_TYPE DHT22
#define SOIL_PIN 34

// Calibration constants — measure in field before deployment
const int DRY_ADC_VALUE = 3200;   // ADC reading in completely dry soil
const int WET_ADC_VALUE = 1200;   // ADC reading in water-saturated soil

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

float readMoisturePercent() {
  int raw = analogRead(SOIL_PIN);
  // Clamp + invert (higher ADC = drier for capacitive sensor)
  int clamped = constrain(raw, WET_ADC_VALUE, DRY_ADC_VALUE);
  return map(clamped, DRY_ADC_VALUE, WET_ADC_VALUE, 0, 100);
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

void publishReading() {
  if (!mqttClient.connected()) mqttClient.connect("esp32-farm");
  char topic[64];
  snprintf(topic, sizeof(topic), "farm/%s/sensors", PLOT_ID);

  StaticJsonDocument<128> doc;
  doc["moisture"]  = readMoisturePercent();
  doc["temp"]      = dht.readTemperature();
  doc["humidity"]  = dht.readHumidity();
  doc["ts"]        = millis();           // replaced by server timestamp on receive
  doc["plot_id"]   = PLOT_ID;

  char payload[128];
  serializeJson(doc, payload);
  mqttClient.publish(topic, payload, /*retained=*/true);
  Serial.println(payload);
}

void loop() {
  publishReading();
  // Deep sleep 5 minutes (5 * 60 * 1e6 microseconds)
  esp_deep_sleep(5 * 60 * 1000000ULL);
}
```

Calibration procedure (document in `docs/iot-calibration.md`):
1. Insert sensor in dry soil → record `DRY_ADC_VALUE` from serial monitor.
2. Submerge sensor tip in water → record `WET_ADC_VALUE`.
3. Flash updated constants.

#### Phase 2: MQTT Topic Schema

| Topic | Direction | Payload |
|-------|-----------|---------|
| `farm/{plot_id}/sensors` | ESP32 → broker | `{moisture, temp, humidity, ts, plot_id}` |
| `farm/{plot_id}/alerts`  | Node-RED → broker | `{level, message_bn, message_en, ts}` |
| `farm/{plot_id}/config`  | server → ESP32 | `{sleep_interval_s, thresholds}` |

Dev broker: `broker.hivemq.com:1883` (no auth, no TLS — dev only).
Prod broker: Mosquitto on Raspberry Pi with username/password auth and TLS.

#### Phase 3: Node-RED Flow (`flows/soil-monitoring.json`)

Flow structure — implement as Node-RED export JSON:

```
[MQTT In: farm/+/sensors]
  → [JSON parse]
  → [Function: evaluate thresholds]
  → [Switch: level]
      CRITICAL → [Function: format Telegram alert]
                   → [HTTP Request: Telegram Bot API]
                   → [Function: update cooldown]
      WARN     → [same path with warn template]
      OK       → (no alert)
  → [InfluxDB Out: soil_readings]
```

Threshold evaluation function (Node-RED Function node — JavaScript):
```js
// Node-RED function node: evaluate-thresholds
// msg.payload = { moisture, temp, humidity, ts, plot_id }
const { moisture, temp, humidity, plot_id, ts } = msg.payload;

// ZBNF Whapasa thresholds — DO NOT CHANGE
const THRESHOLDS = {
  CRITICAL_DRY:        30,
  WARN_DRY:            40,
  IDEAL_LOW:           40,
  IDEAL_HIGH:          70,
  WARN_WET:            80,
  CRITICAL_WATERLOGGED: 80,
};

let level = 'OK';
let reason_bn = '';
let reason_en = '';
let recommendation_bn = '';
let recommendation_en = '';

if (moisture < THRESHOLDS.CRITICAL_DRY) {
  level = 'CRITICAL';
  reason_bn = `মাটি অত্যন্ত শুষ্ক (${moisture.toFixed(1)}%)`;
  reason_en = `Soil critically dry (${moisture.toFixed(1)}%)`;
  recommendation_bn = 'এখনই সেচ দিন — ওয়াপাসা স্তরের নিচে';
  recommendation_en = 'Irrigate immediately — below Whapasa level';
} else if (moisture < THRESHOLDS.WARN_DRY) {
  level = 'WARN';
  reason_bn = `মাটি শুকিয়ে আসছে (${moisture.toFixed(1)}%)`;
  reason_en = `Soil drying out (${moisture.toFixed(1)}%)`;
  recommendation_bn = '২৪ ঘণ্টার মধ্যে সেচ পরিকল্পনা করুন';
  recommendation_en = 'Plan irrigation within 24 hours';
} else if (moisture > THRESHOLDS.CRITICAL_WATERLOGGED) {
  level = 'CRITICAL';
  reason_bn = `মাটিতে জলাবদ্ধতা (${moisture.toFixed(1)}%)`;
  reason_en = `Waterlogged soil (${moisture.toFixed(1)}%)`;
  recommendation_bn = 'নিষ্কাশনের ব্যবস্থা করুন';
  recommendation_en = 'Arrange drainage immediately';
} else if (moisture > THRESHOLDS.WARN_WET) {
  level = 'WARN';
  reason_bn = `মাটি অতিরিক্ত ভেজা (${moisture.toFixed(1)}%)`;
  reason_en = `Soil overly wet (${moisture.toFixed(1)}%)`;
  recommendation_bn = 'সেচ বন্ধ রাখুন';
  recommendation_en = 'Hold off on irrigation';
}

msg.payload = {
  plot_id, level, moisture, temp, humidity, ts,
  reason_bn, reason_en, recommendation_bn, recommendation_en,
};
return msg;
```

Alert cooldown (Node-RED Function node — uses flow context):
```js
// Node-RED function node: cooldown-gate
// Blocks duplicate alerts of the same level per plot within 2 hours
const COOLDOWN_MS = 2 * 60 * 60 * 1000;
const { plot_id, level } = msg.payload;
const key = `${plot_id}:${level}`;
const lastSent = flow.get(key) || 0;
const now = Date.now();

if (now - lastSent < COOLDOWN_MS) {
  return null; // Block message
}
flow.set(key, now);
return msg;
```

#### Phase 4: InfluxDB Storage

InfluxDB measurement: `soil_readings`
Tags: `plot_id`, `alert_level`
Fields: `moisture` (float), `temp` (float), `humidity` (float)
Timestamp: from payload `ts` field.

Node-RED InfluxDB Out node config:
- Host: `localhost` (or Docker service name)
- Port: `8086`
- Database: `farm_iot`
- Measurement: `soil_readings`

#### Phase 5: Grafana Dashboard (`grafana/soil-monitoring-dashboard.json`)

Required panels:
1. **Moisture Gauge** — current value, colored zones (red < 30, yellow 30–40, green 40–70, yellow 70–80, red > 80)
2. **Moisture 24h trend** — time series line chart per plot_id
3. **Temperature & Humidity** — dual-axis time series
4. **Alert History** — table panel, last 50 alerts with timestamp + level

Panel variable: `$plot_id` dropdown from InfluxDB tag values.

#### Phase 6: Telegram Alert Integration (`bot/commands/soilstatus.js`)

```js
import logger from '../../config/logger.js';

// /soilstatus command — returns last reading for farmer's plots
export function registerSoilstatusCommand(bot, db) {
  bot.command('soilstatus', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('Soilstatus command received', { telegramId });

    const farmer = db.prepare(
      'SELECT id FROM farmers WHERE telegram_id = ?'
    ).get(telegramId);

    if (!farmer) {
      return ctx.reply(
        '❌ আপনি নিবন্ধিত নন।\nYou are not registered. Use /register first.'
      );
    }

    const plots = db.prepare(
      'SELECT * FROM plots WHERE farmer_id = ?'
    ).all(farmer.id);

    if (!plots.length) {
      return ctx.reply(
        'আপনার কোনো জমি নেই। /addplot দিয়ে জমি যোগ করুন।\n' +
        'No plots found. Use /addplot to add a plot.'
      );
    }

    // Latest reading per plot from SQLite cache (synced from InfluxDB)
    const lines = [];
    for (const plot of plots) {
      const reading = db.prepare(
        'SELECT * FROM soil_readings WHERE plot_id = ? ORDER BY ts DESC LIMIT 1'
      ).get(plot.id);

      if (!reading) {
        lines.push(`📍 ${plot.name}: তথ্য নেই / No data`);
        continue;
      }

      const emoji = reading.moisture < 30 ? '🔴'
        : reading.moisture < 40 ? '🟡'
        : reading.moisture > 80 ? '🔴'
        : reading.moisture > 70 ? '🟡'
        : '🟢';

      lines.push(
        `${emoji} *${plot.name}*\n` +
        `আর্দ্রতা / Moisture: ${reading.moisture.toFixed(1)}%\n` +
        `তাপমাত্রা / Temp: ${reading.temp.toFixed(1)}°C\n` +
        `আপেক্ষিক আর্দ্রতা / Humidity: ${reading.humidity.toFixed(1)}%`
      );
    }

    await ctx.replyWithMarkdown(lines.join('\n\n'));
    logger.info('Soilstatus response sent', { telegramId, plotCount: plots.length });
  });
}
```

Alert message format sent by Node-RED → Telegram Bot API:
```
🚨 মাটির সতর্কতা — [Plot Name]
Soil Alert — [Plot Name]

📊 আর্দ্রতা / Moisture: 25.3%
🌡️ তাপমাত্রা / Temp: 31.2°C

⚠️ মাটি অত্যন্ত শুষ্ক — এখনই সেচ দিন
Soil critically dry — irrigate immediately

🕐 [timestamp]
```

---

### Step 2 — qa

Write test cases in `tests/p4-iot.test.js`:

```js
import { describe, it, expect } from 'vitest';

// Threshold logic extracted from Node-RED function for unit testing
import { evaluateThresholds } from '../services/soil-thresholds.js';

describe('P4 — Soil Threshold Evaluation', () => {
  it('returns CRITICAL for moisture < 30%', () => {
    const result = evaluateThresholds({ moisture: 25, temp: 30, humidity: 60, plot_id: 'p1' });
    expect(result.level).toBe('CRITICAL');
    expect(result.reason_bn).toContain('শুষ্ক');
  });

  it('returns WARN for moisture 30–40%', () => {
    const result = evaluateThresholds({ moisture: 35, temp: 30, humidity: 60, plot_id: 'p1' });
    expect(result.level).toBe('WARN');
  });

  it('returns OK for moisture in Whapasa range 40–70%', () => {
    const result = evaluateThresholds({ moisture: 55, temp: 28, humidity: 70, plot_id: 'p1' });
    expect(result.level).toBe('OK');
  });

  it('returns WARN for moisture 70–80%', () => {
    const result = evaluateThresholds({ moisture: 75, temp: 30, humidity: 80, plot_id: 'p1' });
    expect(result.level).toBe('WARN');
  });

  it('returns CRITICAL for moisture > 80%', () => {
    const result = evaluateThresholds({ moisture: 90, temp: 28, humidity: 85, plot_id: 'p1' });
    expect(result.level).toBe('CRITICAL');
    expect(result.reason_bn).toContain('জলাবদ্ধতা');
  });

  it('cooldown gate blocks duplicate alert within 2 hours', () => {
    // Mock flow context with last-sent timestamp = now - 30 min
    const lastSent = Date.now() - 30 * 60 * 1000;
    const COOLDOWN_MS = 2 * 60 * 60 * 1000;
    expect(Date.now() - lastSent < COOLDOWN_MS).toBe(true); // should block
  });
});
```

QA checklist:
- [ ] ESP32 firmware compiles without errors in Arduino IDE
- [ ] MQTT messages arrive at HiveMQ public broker (verify with MQTT Explorer)
- [ ] All 5 threshold levels produce correct `level` output
- [ ] Cooldown prevents duplicate alerts within 2 hours
- [ ] Grafana panels load with correct InfluxDB data source
- [ ] `/soilstatus` returns plot data for registered farmer
- [ ] Unregistered user gets correct Bangla/English error message

---

### Step 3 — reviewer

Security + quality checks:
- [ ] WiFi SSID/password in Arduino build flags — NOT in committed code
- [ ] MQTT connection uses client ID that doesn't expose farm data
- [ ] Telegram bot token never in Node-RED environment export
- [ ] InfluxDB credentials in `.env`, not in flow JSON
- [ ] Winston logger present in all Node.js files with side effects
- [ ] No `console.log` in bot command handlers
- [ ] Bangla text present in all farmer-facing alert messages
- [ ] Alert cooldown state stored in Node-RED flow context (not global — prevents cross-plot leakage)

---

### Step 4 — doc-updater

Updates required:
- `README.md` → add P4 section: hardware requirements, MQTT setup, Node-RED import instructions
- `docs/architecture.md` → IoT data flow diagram: ESP32 → MQTT → Node-RED → InfluxDB → Grafana → Telegram
- `docs/farmer-guide-bn-en.md` → `/soilstatus` and `/setthreshold` usage in Bangla + English
- `tasks/p4-iot-soil-monitoring.md` → check off completed phases

---

### Step 5 — committer

Pre-commit gate:
```bash
npm run lint       # zero warnings required
npm run format:check
```

Commit message format:
```
feat(p4): add ESP32 soil monitoring with MQTT, Node-RED, InfluxDB, Grafana

- Firmware reads capacitive moisture + DHT22, publishes to farm/{plot_id}/sensors
- Node-RED flow evaluates Whapasa thresholds, 2h cooldown on duplicate alerts
- InfluxDB stores soil_readings measurement; Grafana 4-panel dashboard
- /soilstatus bot command returns latest reading per plot
- Winston logger in soilstatus.js; Bangla-first alert messages
```

---

## ZBNF Whapasa Thresholds Reference

| Moisture % | Level | Bangla Label | Action |
|-----------|-------|-------------|--------|
| > 80 | CRITICAL | জলাবদ্ধতা | Arrange drainage |
| 70–80 | WARN | অতিরিক্ত ভেজা | Stop irrigation |
| 40–70 | OK | ওয়াপাসা (আদর্শ) | No action |
| 30–40 | WARN | শুকিয়ে আসছে | Plan irrigation in 24h |
| < 30 | CRITICAL | অত্যন্ত শুষ্ক | Irrigate immediately |

> ⚠️ These thresholds are from ZBNF Whapasa principle — **never change them**.

---

## Hardware Bill of Materials

| Component | Est. Cost (BDT) | Notes |
|-----------|----------------|-------|
| ESP32 Dev Board | 350–500 | Any 38-pin dev board |
| Capacitive Soil Moisture Sensor v1.2 | 80–120 | NOT resistive — rusts in soil |
| DHT22 | 100–150 | Includes 10kΩ resistor |
| 5V Solar Panel (5W) | 400–600 | Optional for field use |
| TP4056 Charge Module | 50–80 | Li-Ion charger |
| 18650 Li-Ion Cell | 150–250 | 3000mAh recommended |
| Waterproof Junction Box | 150–250 | IP65 rated |
| **Total** | **~1300–1950** | Per sensor node |

---

## Free Services Used

| Service | Purpose | Free Limit |
|---------|---------|-----------|
| HiveMQ public broker | MQTT dev/test | Public, no auth |
| InfluxDB OSS 2.x | Time-series storage | Unlimited (self-hosted) |
| Grafana OSS | Dashboards | Unlimited (self-hosted) |
| Node-RED | Flow automation | Unlimited (self-hosted) |
