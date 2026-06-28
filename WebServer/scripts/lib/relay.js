// Sum of a device's rolling norm history — the "integrated value" used to rank devices.
function integratedValue(dev) {
  if (!dev.normHistory || dev.normHistory.length === 0) return 0;
  return dev.normHistory.reduce((sum, v) => sum + v, 0);
}

// Determines which device has the highest integrated value.
// Returns the winning deviceId, or null if tied or fewer than 2 devices.
function computeWinner(allDevices) {
  const deviceIds = Object.keys(allDevices);
  if (deviceIds.length < 2) return null;

  const scores = deviceIds.map((id) => ({
    id,
    score: integratedValue(allDevices[id]),
  }));

  const maxScore = Math.max(...scores.map((s) => s.score));
  const leaders = scores.filter((s) => s.score === maxScore);

  if (leaders.length > 1) return null; // tied
  return leaders[0].id;
}


// Compares all devices' integrated values and returns a map of
// deviceId -> "on" | "off". The device(s) with the strictly lowest
// integrated value get "on" (relay on = the "loser" gets boosted/punished,
// adjust meaning as needed). Everyone else gets "off".
// If all devices are tied, returns {} (no commands sent).
function computeRelayCommands(allDevices) {
  const deviceIds = Object.keys(allDevices);
  if (deviceIds.length < 2) return {};

  const scores = deviceIds.map((id) => ({
    id,
    score: integratedValue(allDevices[id]),
  }));

  const minScore = Math.min(...scores.map((s) => s.score));
  const maxScore = Math.max(...scores.map((s) => s.score));

  if (minScore === maxScore) return {};

  const commands = {};
  for (const { id, score } of scores) {
    commands[id] = score === minScore ? "on" : "off";
  }
  return commands;
}

module.exports = { integratedValue, computeRelayCommands, computeRelayCommands, computeWinner };