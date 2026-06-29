# @visualtools/namespace

Zero-dependency dotted-path namespace utilities for JavaScript. Safety-by-default verbs, auto-vivification, and a NotFound sentinel that distinguishes "missing" from "undefined".

Works in **Node.js**, **browsers**, and **TypeScript**.

## Install

```bash
npm install @visualtools/namespace
# or
yarn add @visualtools/namespace
```

## Quick start

```javascript
import namespace from "@visualtools/namespace";
// or: const namespace = require("@visualtools/namespace");

const ctx = {};

// Bare call: ensure a path exists as a plain object
namespace(ctx, "app.config");
// ctx is now { app: { config: {} } }

// Create-only write (throws if path already holds something)
namespace.set(ctx, "app.config.port", 3000);

// Read — returns the value, or the NotFound sentinel if absent
const val = namespace.get(ctx, "app.config.host");
if (namespace.isNotFound(val)) {
  console.log("host not configured yet");
}

// Read — throw if absent (great for fail-fast validation)
const port = namespace.getMustExist(ctx, "app.config.port");

// Read — return a fallback if absent, never write
const host = namespace.getOrDefault(ctx, "app.config.host", "localhost");

// Convergence — write only if absent; return whichever now holds
const cache = namespace.setOrDefault(ctx, "app.cache", new Map());
```

## Why namespace?

**The verb name IS the contract.** Each call encodes a claim about what the rest of the codebase has promised at that point. When the claim is wrong, the error names the exact path and verb — no hunting through stack traces.

**NotFound is not undefined.** `get()` returns a frozen sentinel for absent paths, so you can distinguish "not found" from "found and set to undefined". Most path libraries conflate these.

**Safety by default.** `set()` refuses to overwrite. You must reach for the longer name (`setOverwrite`) to clobber — the verbosity is the signal that you mean it.

## The bare call: `namespace(obj, path)`

Ensures every segment of `path` exists as a plain object.

- **Absent** — vivify as `{}`
- **Plain object** — return it
- **Anything else** (array, string, number, ...) — throw

```javascript
const ctx = {};
const db = namespace(ctx, "services.database");
// ctx is { services: { database: {} } }
// db === ctx.services.database

// Idempotent — second call returns the same object
namespace(ctx, "services.database") === db; // true

// Collision detection — won't silently coerce non-objects
ctx.services.cache = [1, 2, 3];
namespace(ctx, "services.cache"); // throws: non-object value exists at "cache"
```

## Read verbs

Read verbs never write to the object.

### `get(object, path)`

Returns the value at path, or the `NotFound` sentinel if any segment is absent.

```javascript
namespace.get(obj, "a.b.c");           // value or NotFound
namespace.isNotFound(result);          // true if absent
```

### `getMustExist(object, path, options?)`

Returns the value, or throws. Use for fail-fast validation.

```javascript
namespace.getMustExist(obj, "required.field");
namespace.getMustExist(obj, "required.field", {
  errorMessage: "Config error: field is required"
});
```

### `getOrDefault(object, path, standIn)`

Returns the value if present, otherwise `standIn`. Never writes.

```javascript
const timeout = namespace.getOrDefault(config, "http.timeout", 5000);
```

### `getMustEmpty(object, path)`

Throws if a value is present at path. Use as a guard before writing to a slot you know is new.

```javascript
namespace.getMustEmpty(obj, "slot.that.should.be.new");
namespace.set(obj, "slot.that.should.be.new", value);
```

## Write verbs

### `set(object, path, value)`

Create-only. Writes value, throws if path already holds something. Auto-vivifies missing intermediates.

```javascript
namespace.set(obj, "users.alice.role", "admin");
namespace.set(obj, "users.alice.role", "user"); // throws: cannot overwrite
```

### `setMustExist(object, path, value)`

Update-only. Writes value, throws if path is absent. Does NOT auto-vivify — the whole hierarchy must already exist.

```javascript
namespace.setMustExist(obj, "users.alice.role", "user"); // update existing
```

### `setOrDefault(object, path, value)`

Convergence: writes value only if absent; returns whichever now holds. Auto-vivifies intermediates.

```javascript
// Many routes may initialize this — first one wins
const db = namespace.setOrDefault(ctx, "connections.db", createPool());
```

### `setOverwrite(object, path, value, options?)`

Unconditional write. Clobbers any existing value. Auto-vivifies intermediates.

```javascript
namespace.setOverwrite(obj, "status.updated", Date.now());

// By default, throws if an intermediate is a non-object.
// Pass { overwriteStructure: true } to clobber structure too.
namespace.setOverwrite(obj, "a.b.c", 1, { overwriteStructure: true });
```

## Test verbs

### `exists(object, path)`

Returns `true` if the path holds any value — including `0`, `false`, `""`, `null`.

```javascript
if (namespace.exists(config, "feature.enabled")) { ... }
```

### `isNotFound(value)`

Returns `true` if value is the `NotFound` sentinel.

```javascript
const result = namespace.get(obj, "maybe.missing");
if (namespace.isNotFound(result)) { ... }
```

## Path algebra: `namespace.path`

Pure string operations — no tree argument.

```javascript
namespace.path.join("users", userId, "entries");
// "users.alice.entries"

namespace.path.join("a.b", ["c", "d"]);
// "a.b.c.d"

namespace.path.joinSlash("api", "v2", "users");
// "api/v2/users"

namespace.path.split("a.b.c");
// ["a", "b", "c"]

namespace.path.isRootOf("users.alice", "users.alice.entries");
// true

namespace.path.tween("a.b.c");
// "a.children.b.children.c"

namespace.path.tween("a.b.c", "items");
// "a.items.b.items.c"
```

## Batch operations: `namespace.batch`

Multi-path contracts in one call.

```javascript
// Destructure from tree — throws if any path absent
const { db, port } = namespace.batch.destructureMustExist(config, {
  db:   "connections.database.url",
  port: "server.port",
});

// Assert multiple paths exist — keyed by dotted path
const vals = namespace.batch.allMustExist(config, [
  "auth.secret",
  "auth.issuer",
]);

// Extract: assert exists, delete from tree, return value
const token = namespace.batch.extractMustExist(ctx, "pending.token");
```

## Configuration

```javascript
// Append object JSON to error messages (truncated at 200 chars)
namespace.configure({ errorContext: true });

namespace.getMustExist({}, "missing");
// Error: namespace.getMustExist: property not found at "missing"
//   object: {}
```

## Design philosophy

1. **The verb name is the contract** — `set` means create-only; `setOverwrite` means you intend to clobber
2. **NotFound is not undefined** — the sentinel distinguishes absence from a stored `undefined`
3. **Fail fast** — `MustExist` verbs throw with the exact path, not a silent `undefined`
4. **Safety by default** — reaching for the destructive verb requires the longer name
5. **Functions applied to data, never resident in it** — the tree is always plain `{}`
6. **Zero dependencies**

See `METALAND/` for the full applied philosophy.

## License

MIT
