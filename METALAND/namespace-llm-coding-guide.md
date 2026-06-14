# Coding with namespace — an LLM guide

## What this is

You are writing ordinary JavaScript, but all structured state lives at **dotted paths** in plain objects, and you touch that state **only** through `namespace` verbs. The tree of named state is your **supporting structural context**: a shared, inspectable scaffold you write *against*. Every call you make is a **claim about what is true at that point in the code** — and the verb name *is* the claim. You pick the verb whose claim matches your current understanding of the system; the runtime enforces it and fails loudly the moment reality disagrees.

This is not a utility you reach for occasionally. It is the medium you build in.

```javascript
const namespace = require("@namespace-js/core");   // or: import namespace from "@namespace-js/core";
```

Every call is `namespace.<verb>(object, "dotted.path"[, value])` — **object first, path second, value (if any) third.**

---

## Why coding this way makes you stronger

The tree is *strong* — claims are enforced, so a wrong assumption surfaces exactly where you made it — and *flexible* — it imposes no architecture, lifecycle, or order on your code. That combination is what you lean on:

- **The line is a self-contained claim; writing it does not depend on having written the code that satisfies it.** `getMustExist(context, "invoiceCalculator.rules.tax")` states one thing: *by the point execution reaches this line, the system must have established `tax`.* You can commit this line as a finished decision even when no code anywhere yet loads `tax` — authoring it does not require you to have authored the loader. The claim obligates *some* code, *somewhere*, to make `tax` present by the time control arrives here; it says nothing about where that code sits or in what order things run. The runtime holds the obligation.
- **You can create structure on the fly, safely.** Need a place to put something? Make it at a named path. `set` refuses to overwrite by accident, so you grow the tree without fear of silently clobbering prior work.
- **You never carry hidden state between functions.** A behaviour reads its inputs by path and writes its outputs by path. It holds nothing. That is what lets each function you write stay single-purpose — the concerns of *where state lives* and *whether it exists yet* have been factored out into the tree and the verb.
- **Every line declares its own assumptions.** Because the claim is on the face of the call, a future reader (or you, changing this code later) can see very useful constraints about what each namespace call, and the related code, depends on — without tracing backward through the program. You are optimising for the code being *changed*, not for it looking clever when finished.

You code *because* of this structure: it gives you a place to stand. State your claims; let the scaffold enforce them; keep the surrounding code free.

---

## The mental model

> Each call is a present-tense claim about the state of the tree at this point — and, through the modal in its name, a claim about what the **rest of the codebase** must satisfy. The function you choose *is* the design decision.

You are not "checking" or "guarding." You are asserting what your analysis of the system says is true here, and committing that assertion to executable form. Choose the verb that matches the claim you actually mean.

---

## The 8 verbs — pick by the claim you are making

### Reading

| You are claiming… | Use | Returns |
|---|---|---|
| "this **must** already exist — upstream code was required to set it" | `getMustExist(obj, path)` | the value, or **throws** |
| "this **may** be absent, and a stand-in is fine" | `getOrDefault(obj, path, standIn)` | the value, or `standIn` (writes nothing) |
| "this **may** be absent, and I will branch on that" | `get(obj, path)` | the value, or the `NotFound` sentinel |
| "this **must** be empty here" (rare — see note) | `getMustEmpty(obj, path)` | nothing useful; **throws** if present |

### Writing

| You are claiming… | Use | Behaviour |
|---|---|---|
| "nothing here yet — I am creating it" | `set(obj, path, value)` | writes; **throws** if already present |
| "it exists — I am updating it" | `setMustExist(obj, path, value)` | writes; **throws** if absent |
| "routes converge here; set it if no route has, else keep" | `setOrDefault(obj, path, value)` | writes only if empty; returns whichever now holds |
| "I am clobbering on purpose, whatever is there" | `setOverwrite(obj, path, value)` | writes unconditionally |

### Testing

| | |
|---|---|
| `exists(obj, path)` | `true` / `false` (correct for `0`, `false`, `""`, `null`) |
| `isNotFound(value)` | `true` if `value` is the sentinel `get` returns for an absent path |

**The bare verb is the safe one.** Reading is harmless, so bare `get` assumes nothing. Writing is destructive, so bare `set` refuses to clobber — it is create-only. The dangerous write is the long, loud `setOverwrite`; its length is the signal you mean it.

---

## How to choose, in one decision

1. **Reading or writing?** → `get*` or `set*`. This is the first token, so whether the line mutates the tree is visible at a glance. Keep it honest — never hide a write.
2. **What do I know about existence here, right now?**
   - I *know* it is there (someone upstream was required to set it) → `getMustExist` / `setMustExist`
   - I *know* it is not there (I am the creator) → `set`
   - It *might* be there, and that is expected → reading: `getOrDefault` (stand-in) or `get` (branch); writing: `setOrDefault` (keep-first) or `setOverwrite` (clobber)
3. Write the call. If your existence-claim is wrong, the runtime tells you exactly where.

---

## The claim is about *other code*, not the data

`MustExist` is not a fact about the tree — it is a **requirement levied on other code**. It only means something relative to some other part of the system obligated to satisfy it:

- `getMustExist(combatJournal, "configurationFromDisk")` → *"prior code was required to establish this; I depend on that."*
- `set(responseBody, "results.tax", value)` → *"this is the sole creation site for this path; if anything has already created it, that is a bug."*
- `setOrDefault(runtimeState, "cache", {})` → *"many routes converge here; some may have set it, some not, and that is fine."*

The modal is deliberately **silent about *which* code satisfies it and *when***. "Must exist here" names the obligation without naming the producer or the moment. That silence is the point: you can change which upstream loads the value, or have three different routes establish it, without touching this line. The claim is maximally relational and minimally coupled — which is exactly what keeps your code free to be rearranged.

---

## Writing for change

When you later modify a line, you must first reconstruct what it depends on. These verbs put that on the line itself, so you reconstruct nothing:

- `getMustExist(...)` here means *something upstream guarantees this* — look for the establishing code if you need to, but you may also simply trust the contract and change *this* logic safely.
- `setOrDefault(...)` here means *this is a convergence point* — multiple routes reach it; a value you place must be safe to set or skip. **This is the one verb whose mistake is quiet:** if you use it where in fact every route must already have set the value, you have masked a bug `getMustExist` would have caught. Use it only when routes genuinely may differ.
- `set(...)` here means *this is the creation site* — there should be exactly one. If it throws, two routes are creating the same thing, and that is the bug, surfaced.

Verbosity that restates a needed claim on the line is not waste — it is the line telling its future editor what it assumes.

---

## Worked patterns

**Handler preamble — assert every dependency up front, then proceed without guards:**
```javascript
const webHookCollection = namespace.getMustExist(context, "context.interactive.webHookCollection");
const incomingRequest   = namespace.getMustExist(webHookCollection, "incomingRequest");
const combatJournal     = namespace.getMustExist(context, "context.projects.combatJournal");
const configFromDisk    = namespace.getMustExist(combatJournal, "configurationFromDisk");
// Everything below may assume these exist. If any failed, the error is located precisely.
```

**Required vs optional incoming fields:**
```javascript
const entryText = namespace.getMustExist(incomingRequest, "body.entryText");        // required: absent = bad request
const moodLevel = namespace.getOrDefault(incomingRequest, "body.moodLevel", null);  // optional: absent is fine
```

**Initialization boundary — establish state idempotently across all routes:**
```javascript
// Reached on first request, after restart, after a reload flag — any route.
const runtimeState = namespace.setOrDefault(combatJournal, "runtimeState", {});
const cache        = namespace.setOrDefault(runtimeState, "cache", {});
// Whichever route arrived first created them; every later route gets the existing ones.
```

**Branch on presence (distinguishes absent from a stored `null` / `false` / `0`):**
```javascript
const config = namespace.get(combatJournal, "configurationFromDisk");
if (namespace.isNotFound(config)) {
  // genuinely never set — load it now
} else {
  // present, even if its value is falsy
}
```

**Creating new structure (a collision is a real bug, surfaced):**
```javascript
namespace.set(responseBody, "results.tax", computedTax);   // throws if results.tax already exists
```

**Build a response forward, letting position track fault:**
```javascript
const responseBody = { success: false, statusCode: 400 };   // client fault from here
// ...validate required inputs with getMustExist...
responseBody.statusCode = 500;                              // server fault from here
// ...perform the work...
namespace.set(responseBody, "results.entry", savedEntry);
responseBody.statusCode = 200;
responseBody.success    = true;
```

---

## Variable naming (required)

`domainConcept_typeRole` — a camelCase head names *which* subtree; an `_suffix` names *what the variable holds*:

```javascript
const combatJournal_namespace = "context.projects.combatJournal";                       // a dotted-path string
const combatJournal_node      = namespace.setOrDefault(context, combatJournal_namespace, {}); // a live node
const userData_value          = namespace.getMustExist(combatJournal_node, "userData");        // a safe value
const moodLevel_probed        = namespace.get(incomingRequest, "body.moodLevel");             // value-OR-sentinel
```

Rules:
- **Never** abbreviated or two-letter names (`cj`, `ns`). Always semantic camelCase, two or more parts.
- A `_probed` value carries an **unmet obligation** — check it with `isNotFound` before use.
- `grep _node =` finds every live reference; `grep combatJournal` finds the whole domain. The two axes stay independently searchable.

---

## Anti-patterns — never generate these

| Instead of | Write |
|---|---|
| `obj?.a?.b?.c` | `namespace.get(obj, "a.b.c")` + `isNotFound`, or `getOrDefault(obj, "a.b.c", fallback)` |
| `if (obj.count) {…}` | `if (namespace.exists(obj, "count")) {…}` (correct for `0` / `false` / `""`) |
| `if (!obj.a) obj.a = {}` | `namespace.setOrDefault(obj, "a", {})` |
| `obj.a.b = x` (blind) | `namespace.set(obj, "a.b", x)` (create) or `setOverwrite(...)` (deliberate clobber) |
| read-then-write to "ensure" a default | `namespace.setOrDefault(obj, path, value)` |
| `getMustExist` everywhere "to be safe" | use it only where the value **is** guaranteed upstream; otherwise `get` / `getOrDefault` |
| abbreviated handles | full `domainConcept_typeRole` names |

---

## What namespace does NOT do

It does not shape your code. It imposes no architecture, no lifecycle, no execution order, no control-flow style. It never lives *inside* your data — the tree stays plain objects; the verbs are transient operations applied to them, then gone. You write ordinary JavaScript and use these verbs wherever you touch stored state, so that every such line states its own claim and fails loudly when that claim is wrong. The structure is strong; what you build on it is free.
