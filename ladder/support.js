"use strict";

// Deterministic counter — no real clock or UUID.
let counterValue    = 0;
let configLoadCount = 0;

function loadConfigFromDisk() {
  configLoadCount++;
  return { appVersion: 1, loadedAtTick: counterValue };
}

function nextCounter() {
  return ++counterValue;
}

// Call before each test to start from a clean slate.
function resetForTest() {
  counterValue    = 0;
  configLoadCount = 0;
}

function getConfigLoadCount() {
  return configLoadCount;
}

module.exports = { loadConfigFromDisk, nextCounter, resetForTest, getConfigLoadCount };
