// EXPERIMENTAL — scope bridge via eval.
// NOTE: "use strict" is intentionally absent. In strict mode, eval() runs in
// its own scope and var declarations do not land in the enclosing function scope,
// which would break the scope bridge pattern entirely.
// toEval_bindMustExist generates a string that MUST be eval'd in the calling
// scope to bind local variables.  This cannot be wrapped in a helper function.
// See METALAND/namespace-applied-philosophy.md §8 (scope bridge group).

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

    // Scope bridge — binds context subtrees into local variables via eval.
    // The eval runs in THIS function's scope so var declarations land here.
    eval(namespace.toEval_bindMustExist("context", {
      config_node:      "config",
      userEntries_node: namespace.path.join("users", userId_value, "entries"),
    }));
    // config_node and userEntries_node are now local variables

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
