"use strict";
const { loadConfigFromDisk, nextCounter } = require("../support");

module.exports = function handleRequest(context, request) {
  const entryText    = request && request.body ? request.body.entryText    : undefined;
  const timezoneData = request && request.body ? request.body.timezoneData : undefined;
  const userId       = request && request.user ? request.user.id           : undefined;

  if (!entryText)    return { success: false, statusCode: 400, errorMessage: "entryText" };
  if (!timezoneData) return { success: false, statusCode: 400, errorMessage: "timezoneData" };
  if (!userId)       return { success: false, statusCode: 400, errorMessage: "user.id" };

  if (!context.config)          context.config        = loadConfigFromDisk();
  if (!context.users)           context.users         = {};
  if (!context.users[userId])   context.users[userId] = { entries: [] };

  const moodLevel   = request.body.moodLevel   == null ? null : request.body.moodLevel;
  const energyLevel = request.body.energyLevel == null ? null : request.body.energyLevel;

  try {
    if (request.body.__forceFailure) throw new Error("forced save failure");
    const entry = {
      id: nextCounter(), entryText, moodLevel, energyLevel, timezoneData, createdAtTick: nextCounter(),
    };
    context.users[userId].entries.push(entry);
    return { success: true, statusCode: 200, results: { entry } };
  } catch (error) {
    return { success: false, statusCode: 500, errorMessage: error.message };
  }
};
