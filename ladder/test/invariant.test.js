"use strict";

const { test, describe, beforeEach } = require("node:test");
const assert  = require("node:assert/strict");
const path    = require("node:path");

const namespace = require("../namespace/lib");
const support   = require("../support");

const handlerPath_namespace = process.env.LADDER_HANDLER;
if (!handlerPath_namespace) {
  throw new Error("LADDER_HANDLER env var must be set to the absolute path of the handler under test");
}

const handleRequest = require(handlerPath_namespace);

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

// 1. valid request → statusCode 200, results.entry.id present, all body fields echoed
test("valid request returns 200 with entry id and echoed fields", function() {
  const context = {};
  const request_node = makeRequest();
  const response_node = handleRequest(context, request_node);

  assert.equal(response_node.statusCode, 200);
  assert.equal(response_node.success, true);
  assert.ok(response_node.results, "results must be present");
  assert.ok(response_node.results.entry, "results.entry must be present");
  assert.ok(response_node.results.entry.id !== undefined, "entry.id must be present");
  assert.equal(response_node.results.entry.entryText,    "Today I coded.");
  assert.equal(response_node.results.entry.timezoneData, "UTC");
});

// 2. missing entryText → statusCode 400, nothing written to context
test("missing entryText returns 400 and writes nothing to context", function() {
  const context = {};
  const request_node = makeRequest({ body: { entryText: undefined, timezoneData: "UTC" } });
  // Remove entryText from body entirely
  delete request_node.body.entryText;
  const response_node = handleRequest(context, request_node);

  assert.equal(response_node.statusCode, 400);
  assert.equal(response_node.success, false);
  assert.ok(response_node.errorMessage, "errorMessage must be present");
  assert.equal(Object.keys(context).length, 0, "context must be untouched");
});

// 3. missing timezoneData → statusCode 400
test("missing timezoneData returns 400", function() {
  const context = {};
  const request_node = makeRequest();
  delete request_node.body.timezoneData;
  const response_node = handleRequest(context, request_node);

  assert.equal(response_node.statusCode, 400);
  assert.equal(response_node.success, false);
  assert.ok(response_node.errorMessage, "errorMessage must be present");
  assert.equal(Object.keys(context).length, 0, "context must be untouched");
});

// 4. missing user.id → statusCode 400
test("missing user.id returns 400", function() {
  const context = {};
  const request_node = makeRequest();
  delete request_node.user.id;
  const response_node = handleRequest(context, request_node);

  assert.equal(response_node.statusCode, 400);
  assert.equal(response_node.success, false);
  assert.ok(response_node.errorMessage, "errorMessage must be present");
  assert.equal(Object.keys(context).length, 0, "context must be untouched");
});

// 5. optional fields omitted → statusCode 200, stored moodLevel/energyLevel are null
test("optional fields omitted → 200 with null moodLevel and energyLevel", function() {
  const context = {};
  const request_node = makeRequest();
  const response_node = handleRequest(context, request_node);

  assert.equal(response_node.statusCode, 200);
  assert.equal(response_node.results.entry.moodLevel,   null);
  assert.equal(response_node.results.entry.energyLevel, null);
});

// 6. two requests same context → config is established and both succeed
test("two requests with same context both succeed and config is established", function() {
  const context = {};
  const response1_node = handleRequest(context, makeRequest());
  const response2_node = handleRequest(context, makeRequest());

  assert.equal(response1_node.statusCode, 200);
  assert.equal(response2_node.statusCode, 200);
  assert.ok(namespace.exists(context, "config"), "config must be established in context after two requests");
});

// 7. two different users → two separate entry arrays; user A's entries never contain user B's entry
test("two different users have separate entry arrays", function() {
  const context = {};
  const aliceRequest_node = makeRequest({ user: { id: "user-alice" } });
  const bobRequest_node   = makeRequest({ user: { id: "user-bob" } });

  handleRequest(context, aliceRequest_node);
  const bobResponse_node = handleRequest(context, bobRequest_node);

  // Find alice's and bob's entry arrays in context
  const aliceEntries_node = namespace.getMustExist(context, "users.user-alice.entries");
  const bobEntries_node   = namespace.getMustExist(context, "users.user-bob.entries");

  assert.equal(aliceEntries_node.length, 1);
  assert.equal(bobEntries_node.length, 1);

  const bobEntryId_value = bobResponse_node.results.entry.id;
  const aliceEntryIds_node = aliceEntries_node.map(function(entry_node) { return entry_node.id; });
  assert.ok(!aliceEntryIds_node.includes(bobEntryId_value), "alice's entries must not contain bob's entry");
});

// 8. same user two entries → both in that user's array, insertion order preserved
test("same user two entries → both stored in order", function() {
  const context = {};
  const response1_node = handleRequest(context, makeRequest({ body: { entryText: "Entry one", timezoneData: "UTC" } }));
  const response2_node = handleRequest(context, makeRequest({ body: { entryText: "Entry two", timezoneData: "UTC" } }));

  assert.equal(response1_node.statusCode, 200);
  assert.equal(response2_node.statusCode, 200);

  const aliceEntries_node = namespace.getMustExist(context, "users.user-alice.entries");
  assert.equal(aliceEntries_node.length, 2);
  assert.equal(aliceEntries_node[0].entryText, "Entry one");
  assert.equal(aliceEntries_node[1].entryText, "Entry two");
});

// 9. __forceFailure flag → statusCode 500, errorMessage present
test("__forceFailure flag → 500 with errorMessage", function() {
  const context = {};
  const request_node = makeRequest({ body: { entryText: "Today I coded.", timezoneData: "UTC", __forceFailure: true } });
  const response_node = handleRequest(context, request_node);

  assert.equal(response_node.statusCode, 500);
  assert.equal(response_node.success, false);
  assert.ok(response_node.errorMessage, "errorMessage must be present");
});

// 10. stored falsy value (moodLevel: 0) is treated as present, not defaulted to null
test("stored falsy moodLevel: 0 is treated as present not defaulted", function() {
  const context = {};
  const request_node = makeRequest({ body: { entryText: "Today I coded.", timezoneData: "UTC", moodLevel: 0 } });
  const response_node = handleRequest(context, request_node);

  assert.equal(response_node.statusCode, 200);
  assert.equal(response_node.results.entry.moodLevel, 0, "moodLevel 0 must be stored as 0, not null");
});
