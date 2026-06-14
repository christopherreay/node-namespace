"use strict";
const namespace = require("../namespace/lib");
const { nextCounter } = require("../support");

// Consumer — reads config and user entries via getMustExist, writes the entry.
function saveEntry(context_node, userId_value, entryData_node) {
  // Verb mix = all getMustExist → this module is a pure consumer
  const config_node      = require("./configModule").getConfig(context_node);
  const userEntries_node = require("./userModule").getUserEntries(context_node, userId_value);

  const savedEntry_value = {
    id:            nextCounter(),
    entryText:     entryData_node.entryText_value,
    moodLevel:     entryData_node.moodLevel_value,
    energyLevel:   entryData_node.energyLevel_value,
    timezoneData:  entryData_node.timezoneData_value,
    createdAtTick: nextCounter(),
  };

  userEntries_node.push(savedEntry_value);
  return savedEntry_value;
}

module.exports = { saveEntry };
