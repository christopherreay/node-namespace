"use strict";
const namespace    = require("../namespace/lib");
const configModule = require("../rung-6-modules/configModule");
const userModule   = require("../rung-6-modules/userModule");
const { nextCounter } = require("../support");

module.exports = function handleRequest(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const entryText_value    = namespace.getMustExist(request, "body.entryText",    { errorMessage: "entryText" });
    const timezoneData_value = namespace.getMustExist(request, "body.timezoneData", { errorMessage: "timezoneData" });
    const userId_value       = namespace.getMustExist(request, "user.id",           { errorMessage: "user.id" });

    const moodLevel_value   = namespace.getOrDefault(request, "body.moodLevel",   null);
    const energyLevel_value = namespace.getOrDefault(request, "body.energyLevel", null);

    configModule.ensureConfig(context);
    userModule.ensureUserEntries(context, userId_value);

    responseBody_node.statusCode = 500;

    if (namespace.exists(request, "body.__forceFailure")) throw new Error("forced save failure");

    // Batch contract — namespace.batch.destructureMustExist (PENDING RENAME)
    const { config_node, userEntries_node } = namespace.batch.destructureMustExist(context, {
      config_node:      "config",
      userEntries_node: namespace.path.join("users", userId_value, "entries"),
    });

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
  }

  return responseBody_node;
};
