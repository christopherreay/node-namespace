"use strict";
const namespace = require("../namespace/lib");
const { loadConfigFromDisk, nextCounter } = require("../support");

const config_namespace      = "config";
const users_namespace       = "users";
const restarted_namespace   = "__restarted";

module.exports = function handleRequest(context, request) {
  // ── required vs optional ─────────────────────────────────────
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

  // ── route A: handle restart — config slot was cleared externally ──
  // The __restarted flag is the signal; the empty slot is the fact.
  // setOrDefault below re-converges regardless of which route brought us here.
  if (namespace.exists(context, restarted_namespace)) {
    namespace.setOverwrite(context, restarted_namespace, false);
    // context.config was cleared by the caller — setOrDefault re-establishes it
  }

  // ── preamble — converge: first request / post-restart / warm cache ──
  const userEntries_namespace = namespace.path.join(users_namespace, userId_value, "entries");

  namespace.setOrDefault(context, config_namespace,      loadConfigFromDisk());
  namespace.setOrDefault(context, userEntries_namespace, []);
  // route B: if a warm path pre-created userEntries, setOrDefault returns it as-is

  const config_node      = namespace.getMustExist(context, config_namespace);
  const userEntries_node = namespace.getMustExist(context, userEntries_namespace);
  // ── end preamble ─────────────────────────────────────────────

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
