const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { PORT } = require("./config");
const { createMqttClient, sendCommand, startDurationTicker, startRelayTicker } = require("./mqtt");
const createRoutes = require("./routes");
const registerSocketHandlers = require("./socket");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.static("public"));

const mqttClient = createMqttClient(io);
startDurationTicker(io);
startRelayTicker(io, mqttClient);

app.use(createRoutes(mqttClient, sendCommand));
registerSocketHandlers(io, mqttClient, sendCommand);

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});