const express = require("express");
const state = require("./state");

function createRoutes(mqttClient, sendCommand) {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Public", "public", "index.html"));
  });

  router.post("/command", (req, res) => {
    const { deviceId, ...payload } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId is required" });

    sendCommand(mqttClient, deviceId, payload);
    res.json({ ok: true, sent: { deviceId, payload } });
  });

  router.get("/", (req, res) => {
    const filePath = path.join(__dirname, "..", "public", "index.html");
    console.log("Trying to serve:", filePath);
    res.sendFile(filePath);
  });

  return router;
}

module.exports = createRoutes;