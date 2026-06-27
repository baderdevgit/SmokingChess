const state = require("./state");

function registerSocketHandlers(io, mqttClient, sendCommand) {
  io.on("connection", (socket) => {
    console.log("Browser client connected:", socket.id);

    socket.emit("sensor-update", state.getState());

    socket.on("send-command", ({ deviceId, ...payload }) => {
      if (!deviceId) return;
      sendCommand(mqttClient, deviceId, payload);
    });

    socket.on("disconnect", () => {
      console.log("Browser client disconnected:", socket.id);
    });
  });
}

module.exports = registerSocketHandlers;