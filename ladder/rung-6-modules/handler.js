"use strict";
const namespace    = require("../namespace/lib");
const configModule = require("./configModule");
const userModule   = require("./userModule");
const entryModule  = require("./entryModule");

module.exports = function handleRequest(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const entryText_value    = namespace.getMustExist(request, "body.entryText",    { errorMessage: "entryText" });
    const timezoneData_value = namespace.getMustExist(request, "body.timezoneData", { errorMessage: "timezoneData" });
    const userId_value       = namespace.getMustExist(request, "user.id",           { errorMessage: "user.id" });

    const moodLevel_value   = namespace.getOrDefault(request, "body.moodLevel",   null);
    const energyLevel_value = namespace.getOrDefault(request, "body.energyLevel", null);

    // Originators establish their subtrees
    configModule.ensureConfig(context);
    userModule.ensureUserEntries(context, userId_value);

    responseBody_node.statusCode = 500;

    if (namespace.exists(request, "body.__forceFailure")) throw new Error("forced save failure");

    const savedEntry_value = entryModule.saveEntry(context, userId_value, {
      entryText_value, timezoneData_value, moodLevel_value, energyLevel_value,
    });

    namespace.set(responseBody_node, "results.entry", savedEntry_value);
    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};
