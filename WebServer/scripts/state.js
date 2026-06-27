// In-memory store of the latest data from each ESP32 device.
const sensorState = {};

function getState() {
  return sensorState;
}

function getDevice(deviceId) {
  return sensorState[deviceId];
}

function setDevice(deviceId, data) {
  sensorState[deviceId] = data;
}

module.exports = { getState, getDevice, setDevice };