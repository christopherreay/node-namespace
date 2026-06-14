"use strict";
const namespace = require("../namespace/lib");
const { loadConfigFromDisk, nextCounter } = require("../support");

module.exports = function handleRequest(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  const entryText_probed    = namespace.get(request, "body.entryText");
  if (namespace.isNotFound(entryText_probed))    { responseBody_node.errorMessage = "entryText";    return responseBody_node; }
  const timezoneData_probed = namespace.get(request, "body.timezoneData");
  if (namespace.isNotFound(timezoneData_probed)) { responseBody_node.errorMessage = "timezoneData"; return responseBody_node; }
  const userId_probed       = namespace.get(request, "user.id");
  if (namespace.isNotFound(userId_probed))       { responseBody_node.errorMessage = "user.id";      return responseBody_node; }

  // Converge config — many requests reach here; first establishes it
  const config_node      = namespace.setOrDefault(context, "config", loadConfigFromDisk());
  // Converge per-user entries — created on first entry for this user, reused after
  const userEntries_node = namespace.setOrDefault(context, "users." + userId_probed + ".entries", []);

  const moodLevel_value   = namespace.getOrDefault(request, "body.moodLevel",   null);
  const energyLevel_value = namespace.getOrDefault(request, "body.energyLevel", null);

  try {
    if (namespace.exists(request, "body.__forceFailure")) throw new Error("forced save failure");
    const savedEntry_value = {
      id: nextCounter(), entryText: entryText_probed, moodLevel: moodLevel_value,
      energyLevel: energyLevel_value, timezoneData: timezoneData_probed, createdAtTick: nextCounter(),
    };
    userEntries_node.push(savedEntry_value);
    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;
    namespace.set(responseBody_node, "results.entry", savedEntry_value);
    return responseBody_node;
  } catch (error) {
    responseBody_node.statusCode   = 500;
    responseBody_node.errorMessage = error.message;
    return responseBody_node;
  }
};
