# Claude Code task — build a `namespace` refactoring ladder

## Goal

Build **one small program** and refactor it through a sequence of **rungs**. Each rung is a **behaviour-preserving transformation** that expresses *more* of the `namespace` library and *more* structural coordination than the rung before it. A **single, frozen test suite must stay green at every rung.** The behaviour never changes; only the expression climbs.

This demonstrates the library's actual purpose: supporting code that is **changed**. You will change this program eight times and the tests will never move.

---

## The unifying rule (do not break it)

> The test suite (`test/invariant.test.js`) is written once, at the start, and is **identical and passing at every rung**. If a refactor turns a test red, the refactor is wrong — fix the code, never the test.

Each rung lives in its own directory so the progression is inspectable:

```
ladder/
  namespace/lib.js          # the 8-verb implementation (shared by all rungs)
  test/invariant.test.js    # frozen behaviour spec — identical for every rung
  rung-0-plain/handler.js
  rung-1-tree/handler.js
  rung-2-preamble/handler.js
  ...
  rung-8-eval/handler.js
  run.js                    # runs the invariant suite against a chosen rung
```

`run.js <rung-dir>` imports that rung's `handler.js` and runs `test/invariant.test.js` against it. Use Node's built-in `node:test` + `node:assert` (no external deps).

---

## Step 1 — implement the 8 verbs (`namespace/lib.js`)

Implement these exact names and semantics. Signature is always `(object, "dotted.path"[, value])`, object first.

| verb | semantics |
|---|---|
| `get(obj, path)` | return value at path, or the frozen `NotFound` sentinel if absent. No write. |
| `getMustExist(obj, path, opts?)` | return value, or **throw** (`opts.errorMessage` if given). No write. |
| `getOrDefault(obj, path, standIn)` | return value, or `standIn` (**required** arg). No write. |
| `getMustEmpty(obj, path)` | **throw** if present; return nothing useful. No write. |
| `set(obj, path, value)` | create-only — write, **throw** if already present. Auto-vivifies intermediate objects. |
| `setMustExist(obj, path, value)` | update-only — write, **throw** if absent. |
| `setOrDefault(obj, path, value)` | write `value` only if absent; return whichever now holds. Auto-vivifies intermediates. |
| `setOverwrite(obj, path, value)` | write unconditionally. Auto-vivifies intermediates. |
| `exists(obj, path)` | boolean (true even when the stored value is `0` / `false` / `""` / `null`). |
| `isNotFound(value)` | true iff `value` is the `NotFound` sentinel. |

`NotFound` is `Object.freeze({ namespaceFunctionConstant: "NotFound" })`. Existence is tested with `hasOwnProperty` per segment, **not** truthiness. Export all as a single `namespace` object.

Write a few unit tests for `lib.js` itself (separate from the invariant suite) — especially: `exists` returns true for a stored `false`; `set` throws on a present path; `getOrDefault` with no `standIn` is a usage error.

---

## Step 2 — freeze the behaviour and its tests

The program is a **journal-entry submission handler** (in-memory, no real I/O). One exported function:

```js
// handler.js (every rung exports this same signature)
module.exports = function handleRequest(context, request) { /* ... */ return responseBody; };
```

**`context`** is a long-lived object reused across requests (holds loaded config + per-user data).
**`request`** = `{ body: { entryText, timezoneData, moodLevel?, energyLevel? }, user: { id } }`.

Behaviour (frozen — identical at every rung):

1. `entryText`, `timezoneData`, and `user.id` are **required**. Any missing → return `{ success:false, statusCode:400, errorMessage:<which field> }`, write nothing.
2. `moodLevel`, `energyLevel` are **optional**, default `null`.
3. Config is loaded from a stub `loadConfigFromDisk()` **exactly once per `context`**, then reused. (Provide the stub as a counter-incrementing function so tests can assert call count.)
4. Each user's entries live at a per-user path; the entries array is created on that user's first entry and reused after.
5. A saved entry is `{ id, entryText, moodLevel, energyLevel, timezoneData, createdAtTick }` where `id` and `createdAtTick` come from an injected counter (deterministic, no real clock).
6. Success → `{ success:true, statusCode:200, results:{ entry } }`.
7. If the save step throws (simulate via a `request.body.__forceFailure` flag) → `{ success:false, statusCode:500, errorMessage:<message> }`.

**Frozen invariant tests** (`test/invariant.test.js`) — write all of these once:

- valid request → `statusCode 200`, `results.entry.id` present, fields echoed.
- missing `entryText` → `400`, nothing written to `context`.
- missing `user.id` → `400`.
- optional fields omitted → `200`, stored `moodLevel`/`energyLevel` are `null`.
- two requests, same `context` → `loadConfigFromDisk` called **once total**.
- two different users → two separate entry arrays; user A's entries never contain user B's.
- same user, two entries → both in that user's array, order preserved.
- `__forceFailure` → `500`, `errorMessage` present.
- a stored falsy value (e.g. `moodLevel: 0`) is treated as **present**, not defaulted.

---

## Step 3 — the rungs

Each rung: transform the previous rung's `handler.js`, keep the invariant suite green, and add a one-paragraph `NOTES.md` stating *what pain this rung removed*. Run `run.js` after each.

**Rung 0 — plain JS (the "before").**
Deliberately tangled: optional chaining (`request?.body?.entryText`), `if (!context.users[id]) context.users[id] = {...}`, truthiness existence checks (`if (context.config)`), manual nested defaults, an inner `try/catch` around the save with error re-tagging. Working, but every assumption is implicit. *No `namespace` calls.*

**Rung 1 — move state into the tree; basic verbs.**
Introduce a named tree inside `context`. Replace optional chaining with `get` / `getOrDefault`. Replace `if(!x)x={}` with `setOrDefault`. Replace truthiness existence with `exists` / `isNotFound`. Replace blind `context.users[id] = {}` with `set` / `setOrDefault`. Raises: **verb coverage**.

**Rung 2 — handler preamble.**
Pull every dependency the handler needs into a block of `getMustExist` at the top, then delete the now-redundant downstream guards. Demonstrate failure localization by temporarily corrupting `context` in a throwaway script and showing the error names the exact path. Raises: **contract density, failure positioning**.

**Rung 3 — required vs optional, on the face.**
Required body fields → `getMustExist(request, "body.entryText", { errorMessage: "entryText is required" })`. Optional → `getOrDefault(request, "body.moodLevel", null)`. Delete hand-written validation branches; the 400s now fall out of the thrown contract messages (catch them in the outer handler). Raises: **verb coverage, failure positioning**.

**Rung 4 — make convergence real.**
Add genuine alternate routes to the same points so `setOrDefault` is load-bearing, not cosmetic: (a) a `context.__restarted` path that, when set, means config cache was wiped and must re-converge; (b) a "warm path" that may have pre-created a user's entries array before the first request. Add tests for these routes **to a separate `route.test.js`** (the invariant suite stays frozen). Show that the *same* `setOrDefault` lines handle every route correctly without branching. Raises: **route convergence**.

**Rung 5 — build-forward response + position-as-fault.**
Replace the inner `try/catch`/re-tag with: build `responseBody` forward, set `statusCode = 400` before validation and `statusCode = 500` before the save, one outer `catch` that does only `responseBody.errorMessage = error.message`. Use `set(responseBody, "results.entry", entry)` so a double-write would surface. Raises: **failure positioning**.

**Rung 6 — split into coordinating modules.**
Extract `configModule.js` (originator: loads + `set`s config), `userModule.js` (manages per-user subtree), `entryModule.js` (consumer: `getMustExist`s config + user data, writes the entry). Each anchors to a domain constant (`config_namespace`, `users_namespace`, …) used as its subtree root. The handler wires them over one shared `context`. Note in `NOTES.md` how each module's **verb-mix signals its role** (all-`getMustExist` = consumer; `set`-heavy = originator). Raises: **multi-module coordination**.

**Rung 7 — batch contracts.**
Where `entryModule` reads several required values, collapse the preamble into a single batch must-exist call that returns a plain object to destructure. *(The batch verb is not yet renamed in the new scheme — use the working name `destructureMustExist(obj, { localKey: "source.path" })` and leave a `// PENDING RENAME` marker.)* Raises: **batch contracts**.

**Rung 8 — scope bridge (advanced, clearly marked experimental).**
Demonstrate the eval-based tree⇄local-variable bridge for a "deep tool" scenario: generate code that asserts a check-tree exists and binds its values to local variables in one move, then `eval` it in the calling scope. Keep it isolated in `rung-8-eval/` with a prominent `NOTES.md` warning: this must be `eval`'d in the caller's scope, it is powerful for deep/flexible tooling, and it is the one part that cannot be an ordinary function. Raises: **scope bridge**.

---

## Step 4 — make the ladder self-documenting

Produce `ladder/README.md` with a table: rung → verbs introduced → complexity axis raised → pain removed. Add an `npm test`-style script that runs the invariant suite against **all** rungs in sequence and prints a green matrix, proving behaviour is constant across the whole ladder.

---

## Guardrails

- **Never edit `test/invariant.test.js` after Step 2.** A red invariant test means the *code* is wrong.
- **No time-words that conflate authoring with execution.** Describe `getMustExist` as "by the point execution reaches here, this must be established," never "written before the loader." Authoring a contract line does not require the satisfying code to exist yet.
- **Naming:** every variable is `domainConcept_typeRole` camelCase, two+ parts. Never abbreviate (`cfg`, `ns`, `ctx` are banned — use `config_node`, `config_namespace`, `context`). `_node` = live reference, `_namespace` = path string, `_value` = settled value, `_probed` = value-or-sentinel (must `isNotFound`-check).
- **Mutation visible on the line:** never hide a write behind a `get*`. Default writes use `set` (create-only); reach for `setOverwrite` only to clobber deliberately.
- **`get` for branch, `getMustExist` for guaranteed, `getOrDefault` for optional.** Do not use `getMustExist` "to be safe" where the value is genuinely optional.
- Keep everything runnable with **Node core only** (`node:test`, `node:assert`). Deterministic counters instead of real time/UUIDs.

---

## Seed — Rung 0 and Rung 1 (fix the pattern; build the rest in this style)

**`rung-0-plain/handler.js`** (tangled, no namespace):
```js
const { loadConfigFromDisk, nextCounter } = require("../support");

module.exports = function handleRequest(context, request) {
  const entryText = request && request.body ? request.body.entryText : undefined;
  const timezoneData = request && request.body ? request.body.timezoneData : undefined;
  const userId = request && request.user ? request.user.id : undefined;

  if (!entryText) return { success: false, statusCode: 400, errorMessage: "entryText" };
  if (!timezoneData) return { success: false, statusCode: 400, errorMessage: "timezoneData" };
  if (!userId) return { success: false, statusCode: 400, errorMessage: "user.id" };

  if (!context.config) context.config = loadConfigFromDisk();        // load-once, by truthiness (fragile)
  if (!context.users) context.users = {};
  if (!context.users[userId]) context.users[userId] = { entries: [] };

  const moodLevel = request.body.moodLevel == null ? null : request.body.moodLevel;
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
```

**`rung-1-tree/handler.js`** (same behaviour, state in the tree, basic verbs):
```js
const namespace = require("../namespace/lib");
const { loadConfigFromDisk, nextCounter } = require("../support");

module.exports = function handleRequest(context, request) {
  const responseBody = { success: false, statusCode: 400 };

  const entryText_probed = namespace.get(request, "body.entryText");
  if (namespace.isNotFound(entryText_probed)) { responseBody.errorMessage = "entryText"; return responseBody; }
  const timezoneData_probed = namespace.get(request, "body.timezoneData");
  if (namespace.isNotFound(timezoneData_probed)) { responseBody.errorMessage = "timezoneData"; return responseBody; }
  const userId_probed = namespace.get(request, "user.id");
  if (namespace.isNotFound(userId_probed)) { responseBody.errorMessage = "user.id"; return responseBody; }

  // load-once convergence — many requests reach here; first one establishes config
  const config_node = namespace.setOrDefault(context, "config", loadConfigFromDisk());

  // per-user subtree convergence — created on this user's first entry, reused after
  const userEntries_node = namespace.setOrDefault(context, "users." + userId_probed + ".entries", []);

  const moodLevel_value = namespace.getOrDefault(request, "body.moodLevel", null);
  const energyLevel_value = namespace.getOrDefault(request, "body.energyLevel", null);

  try {
    if (namespace.exists(request, "body.__forceFailure")) throw new Error("forced save failure");
    const entry = {
      id: nextCounter(), entryText: entryText_probed, moodLevel: moodLevel_value,
      energyLevel: energyLevel_value, timezoneData: timezoneData_probed, createdAtTick: nextCounter(),
    };
    userEntries_node.push(entry);
    responseBody.statusCode = 200; responseBody.success = true;
    namespace.set(responseBody, "results.entry", entry);
    return responseBody;
  } catch (error) {
    responseBody.statusCode = 500; responseBody.errorMessage = error.message;
    return responseBody;
  }
};
```

`support.js` provides `loadConfigFromDisk` (increments a spy counter, returns a config object) and `nextCounter` (deterministic integer source). Build rungs 2–8 by transforming forward from here, keeping `test/invariant.test.js` green throughout.
