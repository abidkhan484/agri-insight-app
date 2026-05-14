#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Secrets — flash via Arduino IDE build flags, never hardcoded in committed code
// Use -DCONFIG_WIFI_SSID='"your_ssid"' etc.
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
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

void publishReading() {
  if (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect("esp32-farm")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqttClient.state());
      return;
    }
  }

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
  Serial.println("Entering deep sleep for 5 minutes...");
  esp_deep_sleep(5 * 60 * 1000000ULL);
}
