#include <Arduino.h>

const int DATA_PIN  = 14;
const int CLOCK_PIN = 25;

void setup() {
  Serial.begin(115200);
  pinMode(DATA_PIN, INPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  digitalWrite(CLOCK_PIN, LOW);
  Serial.println("Pressure sensor starting...");
}

long readHX710B() {
  // Wait until sensor is ready (DATA pin goes LOW)
  while (digitalRead(DATA_PIN) == HIGH);

  long value = 0;

  // Read 24 bits
  for (int i = 0; i < 24; i++) {
    digitalWrite(CLOCK_PIN, HIGH);
    delayMicroseconds(1);
    value = (value << 1) | digitalRead(DATA_PIN);
    digitalWrite(CLOCK_PIN, LOW);
    delayMicroseconds(1);
  }

  // Send 1 extra pulse to set mode (10Hz, differential input)
  digitalWrite(CLOCK_PIN, HIGH);
  delayMicroseconds(1);
  digitalWrite(CLOCK_PIN, LOW);
  delayMicroseconds(1);

  // Convert from 24-bit two's complement
  if (value & 0x800000) {
    value |= ~0xFFFFFF;
  }

  return value;
}

void loop() {
  long raw = readHX710B();
  Serial.print("Raw pressure: ");
  Serial.println(raw);
  delay(100);
}