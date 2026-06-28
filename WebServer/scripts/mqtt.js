const mqtt = require("mqtt");
const JSON5 = require("json5");
const { MQTT_BROKER } = require("./config");
const state = require("./state");
const { applyReading, tickDuration } = require("./lib/pressure");
const { computeRelayCommands, computeWinner } = require("./lib/relay");

function createMqttClient(io) {
  const client = mqtt.connect(MQTT_BROKER);

  //ON SENSOR CONNECTED
  client.on("connect", () => {
    console.log("Connected to MQTT broker");
    client.subscribe("sensors/#", (err) => {
      if (err) console.error("MQTT subscribe error:", err);
      else console.log('Subscribed to "sensors/#"');
    });
  });

  //HANDLE MQTT MESSAGES
  client.on("message", (topic, message) => {
    const deviceId = topic.split("/")[1];

    let data;
    try {
      data = JSON5.parse(message.toString().trim());
    } catch (e) {
      console.warn(`Non-JSON message from ${deviceId}:`, message.toString());
      return;
    }

    const merged = applyReading(state.getDevice(deviceId) || {}, data);
    state.setDevice(deviceId, merged);

    console.log(`[${deviceId}]`, merged);
    io.emit("sensor-update", state.getState());
  });

  client.on("error", (err) => {
    console.error("MQTT error:", err.message);
  });

  return client;
}

//SEND COMMAND TO MICROCONTROLLER
function sendCommand(client, deviceId, payload) {
  const topic = `commands/${deviceId}`;
  const message = JSON.stringify(payload);
  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) console.error(`Failed to send command to ${deviceId}:`, err);
    else console.log(`Command sent to ${deviceId}:`, payload);
  });
}

function startDurationTicker(io, intervalMs = 200) {
  setInterval(() => {
    let changed = false;
    const allDevices = state.getState();
    for (const deviceId in allDevices) {
      if (tickDuration(allDevices[deviceId])) changed = true;
    }
    if (changed) io.emit("sensor-update", allDevices);
  }, intervalMs);
}

function startRelayTicker(io, client, intervalMs = 200) {
  setInterval(() => {
    const allDevices = state.getState();
    const commands = computeRelayCommands(allDevices);

    for (const deviceId in commands) {
      sendCommand(client, deviceId, { relay: commands[deviceId] });
    }

    const winner = computeWinner(allDevices);
    io.emit("winner-update", { winner }); // separate lightweight event

  }, intervalMs);
}

module.exports = { createMqttClient, sendCommand, startDurationTicker, startRelayTicker };