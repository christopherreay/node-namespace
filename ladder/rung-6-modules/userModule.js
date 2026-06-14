"use strict";
const namespace = require("../namespace/lib");

// Coordinator — manages per-user subtrees.
const users_namespace = "users";

function userEntries_namespace(userId_value) {
  return namespace.path.join(users_namespace, userId_value, "entries");
}

function ensureUserEntries(context_node, userId_value) {
  return namespace.setOrDefault(context_node, userEntries_namespace(userId_value), []);
}

function getUserEntries(context_node, userId_value) {
  return namespace.getMustExist(context_node, userEntries_namespace(userId_value));
}

module.exports = { users_namespace, userEntries_namespace, ensureUserEntries, getUserEntries };
