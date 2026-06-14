"use strict";
const namespace = require("../namespace/lib");
const { loadConfigFromDisk, nextCounter } = require("../support");

const config_namespace    = "config";
const users_namespace     = "users";

module.exports = function handleRequest(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };
  // statusCode 400 = client fault from here

  try {
    // Required — getMustExist throws with the field name; outer catch returns 400
    const entryText_value    = namespace.getMustExist(request, "body.entryText",    { errorMessage: "entryText" });
    const timezoneData_value = namespace.getMustExist(request, "body.timezoneData", { errorMessage: "timezoneData" });
    const userId_value       = namespace.getMustExist(request, "user.id",           { errorMessage: "user.id" });

    // Optional
    const moodLevel_value   = namespace.getOrDefault(request, "body.moodLevel",   null);
    const energyLevel_value = namespace.getOrDefault(request, "body.energyLevel", null);

    // Preamble — converge dependencies
    const userEntries_namespace = namespace.path.join(users_namespace, userId_value, "entries");
    namespace.setOrDefault(context, config_namespace,      loadConfigFromDisk());
    namespace.setOrDefault(context, userEntries_namespace, []);

    const config_node      = namespace.getMustExist(context, config_namespace);
    const userEntries_node = namespace.getMustExist(context, userEntries_namespace);

    // Advance fault position — server fault from here
    responseBody_node.statusCode = 500;

    if (namespace.exists(request, "body.__forceFailure")) throw new Error("forced save failure");

    const savedEntry_value = {
      id: nextCounter(), entryText: entryText_value, moodLevel: moodLevel_value,
      energyLevel: energyLevel_value, timezoneData: timezoneData_value, createdAtTick: nextCounter(),
    };
    userEntries_node.push(savedEntry_value);
    namespace.set(responseBody_node, "results.entry", savedEntry_value);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
    // statusCode is already positioned correctly (400 or 500)
  }

  return responseBody_node;
};
