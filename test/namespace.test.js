"use strict";

/**
 * Test suite for namespace 8-verb API
 * Run with: node --test test/namespace.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const namespace = require("../dist/namespace.cjs");
const { NotFound } = namespace;

// ── bare namespace() — auto-vivify path as plain object ──────────────────────

describe("bare namespace()", () => {
  it("vivifies a single missing segment", () => {
    const obj = {};
    const result = namespace(obj, "a");
    assert.deepStrictEqual(obj, { a: {} });
    assert.equal(result, obj.a);
  });

  it("vivifies a deep missing path", () => {
    const obj = {};
    const result = namespace(obj, "a.b.c");
    assert.deepStrictEqual(obj, { a: { b: { c: {} } } });
    assert.equal(result, obj.a.b.c);
  });

  it("returns existing plain object at leaf without modifying it", () => {
    const existing = { x: 1 };
    const obj = { a: { b: existing } };
    const result = namespace(obj, "a.b");
    assert.equal(result, existing);
    assert.deepStrictEqual(existing, { x: 1 });
  });

  it("vivifies missing tail while traversing existing intermediates", () => {
    const obj = { a: {} };
    const result = namespace(obj, "a.b.c");
    assert.deepStrictEqual(obj, { a: { b: { c: {} } } });
    assert.equal(result, obj.a.b.c);
  });

  it("throws on non-object leaf (string)", () => {
    const obj = { a: "hello" };
    assert.throws(() => namespace(obj, "a"), /non-object value exists at "a"/);
  });

  it("throws on non-object leaf (number)", () => {
    const obj = { a: { b: 42 } };
    assert.throws(() => namespace(obj, "a.b"), /non-object value exists at "b"/);
  });

  it("throws on non-object leaf (array)", () => {
    const obj = { a: [1, 2, 3] };
    assert.throws(() => namespace(obj, "a"), /non-object value exists at "a"/);
  });

  it("throws on non-object intermediate (string)", () => {
    const obj = { a: "blocker" };
    assert.throws(() => namespace(obj, "a.b"), /non-object value exists at "a"/);
  });

  it("throws on non-object intermediate (number)", () => {
    const obj = { a: { b: 99 } };
    assert.throws(() => namespace(obj, "a.b.c"), /non-object value exists at "b"/);
  });

  it("throws on null/undefined path", () => {
    assert.throws(() => namespace({}, null), /path cannot be null or undefined/);
    assert.throws(() => namespace({}, undefined), /path cannot be null or undefined/);
  });

  it("is idempotent — second call returns same object", () => {
    const obj = {};
    const first  = namespace(obj, "a.b");
    const second = namespace(obj, "a.b");
    assert.equal(first, second);
  });

  it("namespace is callable as a function", () => {
    assert.equal(typeof namespace, "function");
  });

  it("verbs still accessible on the function", () => {
    assert.equal(typeof namespace.getIfExists, "function");
    assert.equal(typeof namespace.setNotExists, "function");
    assert.equal(typeof namespace.exists, "function");
  });
});

// ── NotFound sentinel ─────────────────────────────────────────────────────────

describe("NotFound sentinel", () => {
  it("is a frozen object", () => {
    assert.ok(Object.isFrozen(NotFound));
    assert.equal(NotFound.namespaceFunctionConstant, "NotFound");
  });

  it("isNotFound returns true only for the sentinel", () => {
    assert.equal(namespace.isNotFound(NotFound), true);
    assert.equal(namespace.isNotFound({}), false);
    assert.equal(namespace.isNotFound(null), false);
    assert.equal(namespace.isNotFound(undefined), false);
    assert.equal(namespace.isNotFound(0), false);
    assert.equal(namespace.isNotFound(false), false);
    assert.equal(namespace.isNotFound(""), false);
    assert.equal(namespace.isNotFound([]), false);
  });
});

// ── getIfExists ───────────────────────────────────────────────────────────────

describe("getIfExists()", () => {
  it("returns the value at a present path", () => {
    assert.equal(namespace.getIfExists({ a: { b: 42 } }, "a.b"), 42);
  });

  it("returns NotFound for an absent path", () => {
    assert.equal(namespace.getIfExists({}, "a.b"), NotFound);
  });

  it("returns NotFound when an intermediate segment is absent", () => {
    assert.equal(namespace.getIfExists({ a: {} }, "a.b.c"), NotFound);
  });

  it("returns NotFound when an intermediate is null", () => {
    assert.equal(namespace.getIfExists({ a: null }, "a.b"), NotFound);
  });

  it("returns NotFound when an intermediate is a primitive", () => {
    assert.equal(namespace.getIfExists({ a: 5 }, "a.b"), NotFound);
  });

  it("returns the value for all falsy stored values (0, false, '', null)", () => {
    assert.equal(namespace.getIfExists({ v: 0    }, "v"), 0);
    assert.equal(namespace.getIfExists({ v: false }, "v"), false);
    assert.equal(namespace.getIfExists({ v: ""   }, "v"), "");
    assert.equal(namespace.getIfExists({ v: null }, "v"), null);
  });

  it("returns undefined for a stored undefined (key present, value undefined)", () => {
    const obj = { a: undefined };
    const result = namespace.getIfExists(obj, "a");
    assert.equal(result, undefined);
    assert.equal(namespace.isNotFound(result), false);
  });

  it("never writes to the object", () => {
    const obj = { a: 1 };
    namespace.getIfExists(obj, "b");
    assert.deepEqual(obj, { a: 1 });
  });

  it("throws on a non-object root", () => {
    assert.throws(() => namespace.getIfExists(null, "a"), /namespace/);
    assert.throws(() => namespace.getIfExists(undefined, "a"), /namespace/);
    assert.throws(() => namespace.getIfExists("string", "a"), /namespace/);
  });
});

// ── getMustExist ──────────────────────────────────────────────────────────────

describe("getMustExist()", () => {
  it("returns the value when present", () => {
    assert.equal(namespace.getMustExist({ a: { b: "x" } }, "a.b"), "x");
  });

  it("returns falsy values correctly (0 is not treated as absent)", () => {
    assert.equal(namespace.getMustExist({ count: 0 }, "count"), 0);
  });

  it("throws when path is absent", () => {
    assert.throws(() => namespace.getMustExist({}, "a.b"), /getMustExist/);
  });

  it("throws with opts.errorMessage when provided", () => {
    assert.throws(
      () => namespace.getMustExist({}, "a.b", { errorMessage: "entryText is required" }),
      /entryText is required/
    );
  });

  it("includes the path in the default error message", () => {
    assert.throws(
      () => namespace.getMustExist({}, "config.db.url"),
      /config\.db\.url/
    );
  });

  it("never writes", () => {
    const obj = {};
    try { namespace.getMustExist(obj, "a"); } catch (_) {}
    assert.deepEqual(obj, {});
  });
});

// ── getMustEmpty ──────────────────────────────────────────────────────────────

describe("getMustEmpty()", () => {
  it("does not throw when path is absent", () => {
    assert.doesNotThrow(() => namespace.getMustEmpty({}, "a.b"));
  });

  it("throws when path holds a value", () => {
    assert.throws(() => namespace.getMustEmpty({ a: 1 }, "a"), /getMustEmpty/);
  });

  it("throws even for falsy stored values (0 is still present)", () => {
    assert.throws(() => namespace.getMustEmpty({ a: 0 }, "a"), /getMustEmpty/);
    assert.throws(() => namespace.getMustEmpty({ a: false }, "a"), /getMustEmpty/);
    assert.throws(() => namespace.getMustEmpty({ a: null }, "a"), /getMustEmpty/);
  });

  it("never writes", () => {
    const obj = {};
    namespace.getMustEmpty(obj, "a");
    assert.deepEqual(obj, {});
  });
});

// ── getOrDefault ──────────────────────────────────────────────────────────────

describe("getOrDefault()", () => {
  it("returns the stored value when present", () => {
    assert.equal(namespace.getOrDefault({ a: 7 }, "a", 99), 7);
  });

  it("returns standIn when path is absent", () => {
    assert.equal(namespace.getOrDefault({}, "a", 99), 99);
  });

  it("returns standIn 0 when absent (not treated as falsy standIn)", () => {
    assert.equal(namespace.getOrDefault({}, "a", 0), 0);
  });

  it("returns standIn null when absent", () => {
    assert.equal(namespace.getOrDefault({}, "a", null), null);
  });

  it("returns stored 0 not standIn when 0 is stored", () => {
    assert.equal(namespace.getOrDefault({ a: 0 }, "a", 99), 0);
  });

  it("returns stored false not standIn when false is stored", () => {
    assert.equal(namespace.getOrDefault({ a: false }, "a", true), false);
  });

  it("never writes", () => {
    const obj = {};
    namespace.getOrDefault(obj, "a.b", {});
    assert.deepEqual(obj, {});
  });
});

// ── exists ────────────────────────────────────────────────────────────────────

describe("exists()", () => {
  it("returns true for a present path", () => {
    assert.equal(namespace.exists({ a: { b: "x" } }, "a.b"), true);
  });

  it("returns false for an absent path", () => {
    assert.equal(namespace.exists({}, "a.b"), false);
  });

  it("returns true for all falsy stored values (0, false, '', null)", () => {
    assert.equal(namespace.exists({ v: 0 },     "v"), true);
    assert.equal(namespace.exists({ v: false },  "v"), true);
    assert.equal(namespace.exists({ v: "" },     "v"), true);
    assert.equal(namespace.exists({ v: null },   "v"), true);
  });

  it("returns true for stored undefined (key present)", () => {
    assert.equal(namespace.exists({ a: undefined }, "a"), true);
  });

  it("returns false when intermediate is null", () => {
    assert.equal(namespace.exists({ a: null }, "a.b"), false);
  });
});

// ── setNotExists ──────────────────────────────────────────────────────────────

describe("setNotExists()", () => {
  it("writes a value at a new path", () => {
    const obj = {};
    namespace.setNotExists(obj, "a.b", 42);
    assert.equal(obj.a.b, 42);
  });

  it("returns the written value", () => {
    const obj = {};
    const result = namespace.setNotExists(obj, "a", "hello");
    assert.equal(result, "hello");
  });

  it("auto-vivifies missing intermediate objects", () => {
    const obj = {};
    namespace.setNotExists(obj, "a.b.c.d", "deep");
    assert.deepEqual(obj, { a: { b: { c: { d: "deep" } } } });
  });

  it("throws if the path already holds a value", () => {
    assert.throws(() => namespace.setNotExists({ a: 1 }, "a", 2), /cannot overwrite/);
  });

  it("throws even when the existing value is falsy (0 is present)", () => {
    assert.throws(() => namespace.setNotExists({ a: 0 }, "a", 1), /cannot overwrite/);
  });

  it("throws if an intermediate segment is a primitive", () => {
    assert.throws(() => namespace.setNotExists({ a: 5 }, "a.b", 1), /non-object/);
  });

  it("throws for null path", () => {
    assert.throws(() => namespace.setNotExists({}, null, 1), /path cannot be null/);
  });

  it("writes various value types", () => {
    const obj = {};
    namespace.setNotExists(obj, "str",  "hello");
    namespace.setNotExists(obj, "num",  0);
    namespace.setNotExists(obj, "bool", false);
    namespace.setNotExists(obj, "nil",  null);
    namespace.setNotExists(obj, "arr",  [1, 2]);
    assert.equal(obj.str, "hello");
    assert.equal(obj.num, 0);
    assert.equal(obj.bool, false);
    assert.equal(obj.nil, null);
    assert.deepEqual(obj.arr, [1, 2]);
  });
});

// ── setMustExist ──────────────────────────────────────────────────────────────

describe("setMustExist()", () => {
  it("overwrites an existing value", () => {
    const obj = { a: { b: 1 } };
    namespace.setMustExist(obj, "a.b", 99);
    assert.equal(obj.a.b, 99);
  });

  it("returns the written value", () => {
    const obj = { x: 0 };
    assert.equal(namespace.setMustExist(obj, "x", 7), 7);
  });

  it("throws if path is absent", () => {
    assert.throws(() => namespace.setMustExist({}, "a.b", 1), /setMustExist/);
  });

  it("throws if intermediate segment is absent", () => {
    assert.throws(() => namespace.setMustExist({}, "a.b", 1), /setMustExist/);
  });

  it("throws for null path", () => {
    assert.throws(() => namespace.setMustExist({}, null, 1), /path cannot be null/);
  });
});

// ── setOrDefault ─────────────────────────────────────────────────────────────

describe("setOrDefault()", () => {
  it("writes and returns the value when path is absent", () => {
    const obj = {};
    const result = namespace.setOrDefault(obj, "cache", {});
    assert.deepEqual(result, {});
    assert.ok(obj.cache !== undefined);
  });

  it("returns the existing value without writing when path is present", () => {
    const original = [1, 2, 3];
    const obj = { list: original };
    const result = namespace.setOrDefault(obj, "list", []);
    assert.equal(result, original);
    assert.deepEqual(obj.list, [1, 2, 3]);
  });

  it("returns existing falsy values (0) without overwriting", () => {
    const obj = { count: 0 };
    const result = namespace.setOrDefault(obj, "count", 99);
    assert.equal(result, 0);
    assert.equal(obj.count, 0);
  });

  it("returns existing false without overwriting", () => {
    const obj = { flag: false };
    const result = namespace.setOrDefault(obj, "flag", true);
    assert.equal(result, false);
  });

  it("auto-vivifies missing intermediate objects", () => {
    const obj = {};
    namespace.setOrDefault(obj, "a.b.leaf", "first");
    assert.equal(obj.a.b.leaf, "first");
  });

  it("multiple calls to the same absent path — first one wins", () => {
    const context = {};
    const first  = namespace.setOrDefault(context, "config", { x: 1 });
    const second = namespace.setOrDefault(context, "config", { x: 2 });
    assert.equal(first, second);
    assert.equal(context.config.x, 1);
  });

  it("throws if an intermediate is a non-object primitive", () => {
    assert.throws(() => namespace.setOrDefault({ a: 5 }, "a.b", 1), /non-object/);
  });

  it("throws for null path", () => {
    assert.throws(() => namespace.setOrDefault({}, null, 1), /path cannot be null/);
  });
});

// ── setOverwrite ──────────────────────────────────────────────────────────────

describe("setOverwrite()", () => {
  it("writes a new value", () => {
    const obj = {};
    namespace.setOverwrite(obj, "a", 1);
    assert.equal(obj.a, 1);
  });

  it("clobbers an existing value", () => {
    const obj = { a: "old" };
    namespace.setOverwrite(obj, "a", "new");
    assert.equal(obj.a, "new");
  });

  it("returns the written value", () => {
    assert.equal(namespace.setOverwrite({}, "x", 42), 42);
  });

  it("auto-vivifies missing intermediates", () => {
    const obj = {};
    namespace.setOverwrite(obj, "a.b.c", "deep");
    assert.equal(obj.a.b.c, "deep");
  });

  it("throws when an intermediate is a non-object (default — clobber is for values, not structure)", () => {
    assert.throws(() => namespace.setOverwrite({ a: 5 }, "a.b", "leaf"), /non-object/);
  });

  it("clobbers a non-object intermediate with { overwriteStructure: true }", () => {
    const obj = { a: 5 };
    namespace.setOverwrite(obj, "a.b", "leaf", { overwriteStructure: true });
    assert.equal(obj.a.b, "leaf");
  });

  it("throws for null path", () => {
    assert.throws(() => namespace.setOverwrite({}, null, 1), /path cannot be null/);
  });
});

// ── rm ────────────────────────────────────────────────────────────────────────

describe("rm()", () => {
  it("removes and returns a present value", () => {
    const obj = { a: { b: 42 } };
    const result = namespace.rm(obj, "a.b");
    assert.equal(result, 42);
    assert.deepStrictEqual(obj, { a: {} });
  });

  it("returns NotFound for absent path", () => {
    const obj = { a: {} };
    const result = namespace.rm(obj, "a.b");
    assert.equal(namespace.isNotFound(result), true);
  });

  it("removes a top-level key", () => {
    const obj = { x: "hello" };
    const result = namespace.rm(obj, "x");
    assert.equal(result, "hello");
    assert.deepStrictEqual(obj, {});
  });

  it("returns NotFound when intermediate is missing", () => {
    const obj = {};
    const result = namespace.rm(obj, "a.b.c");
    assert.equal(namespace.isNotFound(result), true);
  });
});

describe("rmMustExist()", () => {
  it("removes and returns a present value", () => {
    const obj = { a: { b: "val" } };
    const result = namespace.rmMustExist(obj, "a.b");
    assert.equal(result, "val");
    assert.deepStrictEqual(obj, { a: {} });
  });

  it("throws when path is absent", () => {
    const obj = { a: {} };
    assert.throws(() => namespace.rmMustExist(obj, "a.b"), /path does not exist/);
  });
});

// ── convergence pattern ───────────────────────────────────────────────────────

describe("convergence pattern (setOrDefault load-once)", () => {
  it("config loaded exactly once across many calls", () => {
    let loadCount = 0;
    function loadConfig() { loadCount++; return { version: 1 }; }

    const context = {};
    for (let i = 0; i < 5; i++) {
      namespace.setOrDefault(context, "config", loadConfig());
    }
    // loadConfig() is evaluated 5 times (JS eager evaluation),
    // but only the first result is stored.
    assert.equal(context.config.version, 1);
    assert.equal(loadCount, 5);
  });

  it("first caller establishes the value; later callers get the same object", () => {
    const context = {};
    const first  = namespace.setOrDefault(context, "users.alice.entries", []);
    first.push("entry-1");
    const second = namespace.setOrDefault(context, "users.alice.entries", []);
    assert.equal(first, second);
    assert.equal(second.length, 1);
  });
});

// ── build-forward response pattern ───────────────────────────────────────────

describe("build-forward response pattern", () => {
  it("statusCode position tracks fault correctly", () => {
    function handleRequest(request) {
      const responseBody = { success: false, statusCode: 400 };

      const entryText = namespace.getIfExists(request, "body.entryText");
      if (namespace.isNotFound(entryText)) {
        responseBody.errorMessage = "entryText";
        return responseBody;
      }

      responseBody.statusCode = 500;
      try {
        if (request.body.__forceFailure) throw new Error("forced failure");
        namespace.setNotExists(responseBody, "results.entry", { id: 1, entryText });
        responseBody.statusCode = 200;
        responseBody.success    = true;
      } catch (error) {
        responseBody.errorMessage = error.message;
      }
      return responseBody;
    }

    assert.equal(handleRequest({ body: { entryText: "hello" } }).statusCode, 200);
    assert.equal(handleRequest({ body: {} }).statusCode, 400);
    assert.equal(handleRequest({ body: { entryText: "hi", __forceFailure: true } }).statusCode, 500);
  });
});

// ── handler preamble pattern ──────────────────────────────────────────────────

describe("handler preamble pattern", () => {
  it("getMustExist locates the failure precisely", () => {
    const context = { config: { db: { url: "postgres://localhost" } } };
    const context_bad = { config: {} };

    assert.doesNotThrow(() => namespace.getMustExist(context, "config.db.url"));
    assert.throws(
      () => namespace.getMustExist(context_bad, "config.db.url"),
      /config\.db\.url/
    );
  });
});

// ── namespace.path ────────────────────────────────────────────────────────────

describe("namespace.path.join()", () => {
  it("joins string parts with dots", () => {
    assert.equal(namespace.path.join("a", "b", "c"), "a.b.c");
  });

  it("flattens dotted strings — partial paths compose cleanly", () => {
    assert.equal(namespace.path.join("a.b", "c"), "a.b.c");
  });

  it("flattens arrays", () => {
    assert.equal(namespace.path.join("a", ["b", "c"]), "a.b.c");
  });

  it("handles mixed arrays and dotted strings", () => {
    assert.equal(namespace.path.join("a.b", ["c", "d"], "e"), "a.b.c.d.e");
  });

  it("primary use case — build a path from domain constants and runtime values", () => {
    const users_namespace = "users";
    const userId_value    = "alice";
    assert.equal(namespace.path.join(users_namespace, userId_value, "entries"), "users.alice.entries");
  });

  it("returns empty string for no parts", () => {
    assert.equal(namespace.path.join(), "");
  });
});

describe("namespace.path.joinSlash()", () => {
  it("joins parts with slashes", () => {
    assert.equal(namespace.path.joinSlash("a", "b", "c"), "a/b/c");
  });

  it("flattens slash-separated strings", () => {
    assert.equal(namespace.path.joinSlash("a/b", "c"), "a/b/c");
  });
});

describe("namespace.path.split()", () => {
  it("splits a dotted path into segments", () => {
    assert.deepEqual(namespace.path.split("a.b.c"), ["a", "b", "c"]);
  });

  it("single segment returns a one-element array", () => {
    assert.deepEqual(namespace.path.split("a"), ["a"]);
  });

  it("throws for non-string input", () => {
    assert.throws(() => namespace.path.split(42), /must be a string/);
  });
});

describe("namespace.path.isRootOf()", () => {
  it("returns true when root is a proper prefix at a segment boundary", () => {
    assert.equal(namespace.path.isRootOf("users.alice", "users.alice.entries"), true);
  });

  it("returns true for an exact match", () => {
    assert.equal(namespace.path.isRootOf("users.alice", "users.alice"), true);
  });

  it("returns false when the match is not at a segment boundary", () => {
    assert.equal(namespace.path.isRootOf("users.alice", "users.alicex"), false);
  });

  it("returns false for an unrelated path", () => {
    assert.equal(namespace.path.isRootOf("users.alice", "users.bob.entries"), false);
  });

  it("single-segment root", () => {
    assert.equal(namespace.path.isRootOf("users", "users.alice.entries"), true);
    assert.equal(namespace.path.isRootOf("users", "config"), false);
  });
});

describe("namespace.path.tween()", () => {
  it("inserts default 'children' between each segment", () => {
    assert.equal(namespace.path.tween("a.b.c"), "a.children.b.children.c");
  });

  it("uses a custom separator when provided", () => {
    assert.equal(namespace.path.tween("a.b.c", "items"), "a.items.b.items.c");
  });

  it("single-segment path passes through unchanged", () => {
    assert.equal(namespace.path.tween("a"), "a");
  });

  it("returns undefined for non-string input", () => {
    assert.equal(namespace.path.tween(null), undefined);
  });
});

// ── namespace.batch ───────────────────────────────────────────────────────────

describe("namespace.batch.destructureMustExist()", () => {
  it("returns a plain object mapping local keys to tree values", () => {
    const obj = { a: 1, b: { c: 2 } };
    const result_node = namespace.batch.destructureMustExist(obj, {
      first_value:  "a",
      second_value: "b.c",
    });
    assert.deepEqual(result_node, { first_value: 1, second_value: 2 });
  });

  it("throws if any path is absent — and names the path", () => {
    const obj = { a: 1 };
    assert.throws(
      () => namespace.batch.destructureMustExist(obj, { x: "a", y: "missing.path" }),
      /missing\.path/
    );
  });

  it("supports opts.errorMessage forwarded to getMustExist", () => {
    const obj = {};
    assert.throws(
      () => namespace.batch.destructureMustExist(obj, { x: "a" }, { errorMessage: "a is required" }),
      /a is required/
    );
  });

  it("the mapping IS the preamble — destructure the result directly", () => {
    const context = { config: { version: 2 }, users: { alice: { entries: [] } } };
    const { config_node, userEntries_node } = namespace.batch.destructureMustExist(context, {
      config_node:      "config",
      userEntries_node: "users.alice.entries",
    });
    assert.equal(config_node.version, 2);
    assert.deepEqual(userEntries_node, []);
  });
});

describe("namespace.batch.allMustExist()", () => {
  it("returns object keyed by the dotted paths themselves", () => {
    const obj = { a: { b: 1 }, c: { d: 2 } };
    const result_node = namespace.batch.allMustExist(obj, ["a.b", "c.d"]);
    assert.deepEqual(result_node, { "a.b": 1, "c.d": 2 });
  });

  it("throws if any path is absent", () => {
    const obj = { a: 1 };
    assert.throws(() => namespace.batch.allMustExist(obj, ["a", "b"]), /getMustExist/);
  });

  it("works with a single-path list", () => {
    const obj = { x: 42 };
    assert.deepEqual(namespace.batch.allMustExist(obj, ["x"]), { x: 42 });
  });
});

describe("namespace.batch.extractMustExist()", () => {
  it("returns the value and removes it from the tree", () => {
    const obj = { token: "abc", other: 1 };
    const extracted_value = namespace.batch.extractMustExist(obj, "token");
    assert.equal(extracted_value, "abc");
    assert.equal(namespace.exists(obj, "token"), false);
    assert.equal(obj.other, 1);
  });

  it("works on a nested path", () => {
    const obj = { queue: { first: "msg1", second: "msg2" } };
    const extracted_value = namespace.batch.extractMustExist(obj, "queue.first");
    assert.equal(extracted_value, "msg1");
    assert.equal(namespace.exists(obj, "queue.first"), false);
    assert.equal(obj.queue.second, "msg2");
  });

  it("throws if the path is absent", () => {
    const obj = {};
    assert.throws(() => namespace.batch.extractMustExist(obj, "missing"), /getMustExist/);
  });

  it("does not leave empty parent objects behind — parent remains", () => {
    const obj = { a: { b: 1, c: 2 } };
    namespace.batch.extractMustExist(obj, "a.b");
    assert.ok(obj.a);
    assert.equal(obj.a.c, 2);
  });
});

// ── namespace.configure ───────────────────────────────────────────────────────

describe("namespace.configure()", () => {
  // Always reset after each configure test so state doesn't leak
  function reset() { namespace.configure({ errorContext: false }); }

  it("errorContext: false — error message has no object context (default)", () => {
    reset();
    try { namespace.getMustExist({ a: 1 }, "missing"); } catch (error) {
      assert.ok(!error.message.includes("object:"));
    }
  });

  it("errorContext: true — getMustExist error includes object JSON", () => {
    namespace.configure({ errorContext: true });
    try {
      namespace.getMustExist({ user: { name: "alice" } }, "user.missing");
      assert.fail("should have thrown");
    } catch (error) {
      assert.ok(error.message.includes("object:"));
      assert.ok(error.message.includes("alice"));
    }
    reset();
  });

  it("errorContext: true — getMustEmpty error includes object JSON", () => {
    namespace.configure({ errorContext: true });
    try {
      namespace.getMustEmpty({ occupied: "yes" }, "occupied");
      assert.fail("should have thrown");
    } catch (error) {
      assert.ok(error.message.includes("object:"));
      assert.ok(error.message.includes("yes"));
    }
    reset();
  });

  it("errorContext: true — setOverwrite non-object error includes object JSON", () => {
    namespace.configure({ errorContext: true });
    try {
      namespace.setOverwrite({ a: 5 }, "a.b", "leaf");
      assert.fail("should have thrown");
    } catch (error) {
      assert.ok(error.message.includes("object:"));
    }
    reset();
  });

  it("errorContext: true — object JSON is truncated at 200 chars with ellipsis", () => {
    namespace.configure({ errorContext: true });
    const bigObj = {};
    for (let i = 0; i < 50; i++) bigObj[`key${i}`] = `value${i}`;
    try {
      namespace.getMustExist(bigObj, "missing");
      assert.fail("should have thrown");
    } catch (error) {
      const objectLine_value = error.message.split("\n").find(line => line.includes("object:"));
      assert.ok(objectLine_value, "error should have an object: line");
      // Content after "object: " should be <= 201 chars (200 + ellipsis)
      const content_value = objectLine_value.replace("  object: ", "");
      assert.ok(content_value.length <= 201, `object context too long: ${content_value.length}`);
      assert.ok(content_value.endsWith("…"), "truncated content should end with ellipsis");
    }
    reset();
  });

  it("configure is idempotent — can be called multiple times", () => {
    namespace.configure({ errorContext: true });
    namespace.configure({ errorContext: true });
    namespace.configure({ errorContext: false });
    // Should not throw
    try { namespace.getMustExist({}, "x"); } catch (error) {
      assert.ok(!error.message.includes("object:"));
    }
  });
});

// ── verb exports ──────────────────────────────────────────────────────────────

describe("namespace exports", () => {
  const verbs = [
    "configure",
    "getIfExists", "getMustExist", "getMustEmpty", "getOrDefault",
    "setNotExists", "setMustExist", "setOrDefault", "setOverwrite",
    "rm", "rmMustExist",
    "exists", "isNotFound",
  ];

  for (const verb of verbs) {
    it(`exports ${verb} as a function`, () => {
      assert.equal(typeof namespace[verb], "function");
    });
  }

  it("exports NotFound sentinel", () => {
    assert.ok(namespace.NotFound);
    assert.ok(Object.isFrozen(namespace.NotFound));
  });
});
