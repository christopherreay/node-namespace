"use strict";

// Route-specific tests for rung-4-convergence — NOT in the invariant suite.
// These test alternate routes that demonstrate setOrDefault is load-bearing.

const { test, beforeEach } = require("node:test");
const assert   = require("node:assert/strict");
const path     = require("node:path");

const namespace     = require("../namespace/lib");
const support       = require("../support");
const handleRequest = require("./handler");

function makeRequest(overrides_node) {
  return {
    body: {
      entryText:    "Today I coded.",
      timezoneData: "UTC",
      ...((overrides_node && overrides_node.body) || {}),
    },
    user: {
      id: "user-alice",
      ...((overrides_node && overrides_node.user) || {}),
    },
  };
}

beforeEach(function() {
  support.resetForTest();
});

// Route A: post-restart re-convergence
// Make a normal request, wipe context.config + set __restarted, make another request.
// Assert second response is success 200 and context.config exists again.
test("post-restart: config re-converges after slot cleared and __restarted set", function() {
  const context = {};

  const response1_node = handleRequest(context, makeRequest());
  assert.equal(response1_node.statusCode, 200);
  assert.ok(namespace.exists(context, "config"), "config must exist after first request");

  // Simulate external wipe of config
  delete context.config;
  namespace.setOverwrite(context, "__restarted", true);

  const response2_node = handleRequest(context, makeRequest());
  assert.equal(response2_node.statusCode, 200, "second request after restart must succeed");
  assert.ok(namespace.exists(context, "config"), "config must be re-established after restart");
});

// Route B: warm-path entries array is preserved
// Pre-populate context.users.user-alice.entries with a sentinel entry,
// then make a request for user-alice.
// Assert the pre-existing entry is still in the array (setOrDefault didn't overwrite it),
// AND the new entry was appended.
test("warm-path: pre-created entries array is preserved, new entry appended", function() {
  const context = {};

  // Pre-populate the entries array (warm path)
  namespace.setOrDefault(context, "users.user-alice.entries", []);
  const priorEntries_node = namespace.getMustExist(context, "users.user-alice.entries");
  priorEntries_node.push({ id: "pre" });

  const response_node = handleRequest(context, makeRequest());
  assert.equal(response_node.statusCode, 200, "request after warm path must succeed");

  const aliceEntries_node = namespace.getMustExist(context, "users.user-alice.entries");
  assert.equal(aliceEntries_node.length, 2, "entries array must have pre-existing entry plus new one");
  assert.equal(aliceEntries_node[0].id, "pre", "pre-existing entry must be first");
  assert.ok(aliceEntries_node[1].id !== "pre", "second entry must be the new one");
});
