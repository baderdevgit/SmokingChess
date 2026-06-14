const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mqtt = require("mqtt");
const JSON5 = require('json5');

// ─── App setup ───────────────────────────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.static("public")); // serves your frontend from /public

const PORT = 3000;
const MQTT_BROKER = "mqtt://localhost";

// ─── In-memory state ─────────────────────────────────────────────────────────

// Holds the latest data from each ESP32.
// Gets populated dynamically — no need to hardcode device IDs.
const sensorState = {};

// ─── MQTT ────────────────────────────────────────────────────────────────────

const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Wildcard # matches any topic under sensors/
  // e.g. sensors/esp32-a, sensors/A4:CF:12:7B:3E:91, etc.
  mqttClient.subscribe("sensors/#", (err) => {
    if (err) console.error("MQTT subscribe error:", err);
    else console.log('Subscribed to "sensors/#"');
  });
});

mqttClient.on("message", (topic, message) => {
  // topic looks like "sensors/esp32-a"
  const deviceId = topic.split("/")[1];

  let data;
  try {
    data = JSON5.parse(message.toString().trim());
  } catch (e) {
    console.warn(`Non-JSON message from ${deviceId}:`, message.toString());
    return;
  }

  // Merge new fields into existing state for this device
  // so a device can publish partial updates without wiping old fields
  sensorState[deviceId] = {
    ...sensorState[deviceId],
    ...data,
    lastSeen: new Date().toISOString(),
  };

  console.log(`[${deviceId}]`, sensorState[deviceId]);

  // Broadcast updated state to all connected browser clients
  io.emit("sensor-update", sensorState);

  // ── Threshold check example ───────────────────────────────────────────────
  // Uncomment and adapt to your needs:
  //
  // if (data.temp !== undefined && data.temp > 80) {
  //   sendCommand(deviceId, { action: "fan", value: "on" });
  // }
});

mqttClient.on("error", (err) => {
  console.error("MQTT error:", err.message);
});

// ─── Helper: send a command to a specific ESP32 ──────────────────────────────

function sendCommand(deviceId, payload) {
  const topic = `commands/${deviceId}`;
  const message = JSON.stringify(payload);
  mqttClient.publish(topic, message, { qos: 1 }, (err) => {
    if (err) console.error(`Failed to send command to ${deviceId}:`, err);
    else console.log(`Command sent to ${deviceId}:`, payload);
  });
}

// ─── REST endpoint: send a command from the dashboard ────────────────────────

// POST /command
// Body: { "deviceId": "esp32-a", "action": "led", "value": "on" }
app.post("/command", (req, res) => {
  const { deviceId, ...payload } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId is required" });
  }

  sendCommand(deviceId, payload);
  res.json({ ok: true, sent: { deviceId, payload } });
});

// ─── REST endpoint: get current state snapshot ───────────────────────────────

// GET /state — useful for the frontend on initial page load
app.get("/state", (req, res) => {
  res.json(sensorState);
});

// ─── Socket.IO: browser connects ─────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("Browser client connected:", socket.id);

  // Send the current snapshot immediately so the UI isn't blank on load
  socket.emit("sensor-update", sensorState);

  // Browser can also send commands via WebSocket instead of REST
  socket.on("send-command", ({ deviceId, ...payload }) => {
    if (!deviceId) return;
    sendCommand(deviceId, payload);
  });

  socket.on("disconnect", () => {
    console.log("Browser client disconnected:", socket.id);
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
