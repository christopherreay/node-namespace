"use strict";
const namespace = require("../namespace/lib");
const { loadConfigFromDisk } = require("../support");

// Originator — establishes config in context and owns its namespace.
const config_namespace = "config";

function ensureConfig(context_node) {
  return namespace.setOrDefault(context_node, config_namespace, loadConfigFromDisk());
}

function getConfig(context_node) {
  return namespace.getMustExist(context_node, config_namespace);
}

module.exports = { config_namespace, ensureConfig, getConfig };
