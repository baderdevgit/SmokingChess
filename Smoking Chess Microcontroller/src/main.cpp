#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "credentials.h"

const int   MQTT_PORT     = 1883;

const int DATA_PIN  = 14;
const int CLOCK_PIN = 25;

String deviceId;
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

long readHX710B() {
  while (digitalRead(DATA_PIN) == HIGH);
  long value = 0;
  for (int i = 0; i < 24; i++) {
    digitalWrite(CLOCK_PIN, HIGH);
    delayMicroseconds(1);
    value = (value << 1) | digitalRead(DATA_PIN);
    digitalWrite(CLOCK_PIN, LOW);
    delayMicroseconds(1);
  }
  digitalWrite(CLOCK_PIN, HIGH);
  delayMicroseconds(1);
  digitalWrite(CLOCK_PIN, LOW);
  delayMicroseconds(1);
  if (value & 0x800000) value |= ~0xFFFFFF;
  return value;
}

void connectWifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
  Serial.println("Device ID: " + deviceId);
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqtt.connect(deviceId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.println("failed, retrying in 2s");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(DATA_PIN, INPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  digitalWrite(CLOCK_PIN, LOW);
  Serial.println("Pressure sensor starting...");

  connectWifi();
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
}

void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  long raw = readHX710B();
  Serial.print("Raw pressure: ");
  Serial.println(raw);

  String topic = "sensors/" + deviceId;
  String payload = "{pressure: " + String(raw) + "}";

  Serial.println("Publishing to: " + topic);
  Serial.println("Payload: " + payload);

  bool success = mqtt.publish(topic.c_str(), payload.c_str());
  Serial.println(success ? "Pub OK" : "Pub fail");

  delay(100);
}