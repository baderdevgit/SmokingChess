const { BASELINE, MAX_NEGATIVE } = require("../config");

function normalize(raw) {
  const delta = BASELINE - raw;
  return (delta / MAX_NEGATIVE) * 100;
}

// Merges an incoming reading into a device's existing state,
// tracking how long the reading has been continuously non-zero.
function applyReading(existing, data) {
  const merged = {
    ...existing,
    ...data,
    lastSeen: new Date().toISOString(),
  };

  const norm = data.pressure !== undefined ? normalize(data.pressure) : null;
  const isActive = norm !== null && norm >= 1;

  if(norm != null) {
    merged.norm = norm;
  }

  if (isActive) {
    merged.nonZeroSince = existing.nonZeroSince || Date.now();
    merged.duration = (Date.now() - merged.nonZeroSince) / 1000;
  } else {
    merged.nonZeroSince = null;
    merged.duration = 0;
  }

  return merged;
}

// Recomputes duration for a device still mid-puff; used by the ticker
// to keep duration climbing smoothly between MQTT messages.
function tickDuration(dev) {
  if (dev.nonZeroSince) {
    dev.duration = (Date.now() - dev.nonZeroSince) / 1000;
    return true;
  }
  return false;
}

module.exports = { normalize, applyReading, tickDuration };