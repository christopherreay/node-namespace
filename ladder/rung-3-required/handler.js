"use strict";
const namespace = require("../namespace/lib");
const { loadConfigFromDisk, nextCounter } = require("../support");

module.exports = function handleRequest(context, request) {
  // ── required vs optional, on the face ──────────────────────
  let entryText_value, timezoneData_value, userId_value;
  try {
    entryText_value    = namespace.getMustExist(request, "body.entryText",    { errorMessage: "entryText" });
    timezoneData_value = namespace.getMustExist(request, "body.timezoneData", { errorMessage: "timezoneData" });
    userId_value       = namespace.getMustExist(request, "user.id",           { errorMessage: "user.id" });
  } catch (validationError) {
    return { success: false, statusCode: 400, errorMessage: validationError.message };
  }

  const moodLevel_value   = namespace.getOrDefault(request, "body.moodLevel",   null);
  const energyLevel_value = namespace.getOrDefault(request, "body.energyLevel", null);

  // ── preamble ────────────────────────────────────────────────
  namespace.setOrDefault(context, "config",                              loadConfigFromDisk());
  namespace.setOrDefault(context, "users." + userId_value + ".entries", []);

  const config_node      = namespace.getMustExist(context, "config");
  const userEntries_node = namespace.getMustExist(context, "users." + userId_value + ".entries");
  // ── end preamble ────────────────────────────────────────────

  try {
    if (namespace.exists(request, "body.__forceFailure")) throw new Error("forced save failure");
    const savedEntry_value = {
      id: nextCounter(), entryText: entryText_value, moodLevel: moodLevel_value,
      energyLevel: energyLevel_value, timezoneData: timezoneData_value, createdAtTick: nextCounter(),
    };
    userEntries_node.push(savedEntry_value);
    const responseBody_node = { success: true, statusCode: 200 };
    namespace.set(responseBody_node, "results.entry", savedEntry_value);
    return responseBody_node;
  } catch (error) {
    return { success: false, statusCode: 500, errorMessage: error.message };
  }
};
