# namespace — LLM Lens

A guide for LLMs working in codebases that use the `namespace` library.

## The Core Idea

Every namespace call is a **present-tense, prescriptive assertion** — a claim about what *should* be true at that exact point in execution, for the code to be correct.

- `getMustExist(...)` → *"This must exist here. If it doesn't, something upstream is broken."*
- `getIfExists(...)` → *"This may or may not exist — the system handles both cases."*
- `exists(...)` → *"Correct behaviour branches on presence, not truthiness."*
- `leafNode(...)` → *"This should be initialized. If it hasn't been, I am doing it now."*
- `setValue(...)` → *"I am building structure forward from here."*

This is not just documentation. Each assertion is a **specification** — it declares what must hold for the code to be correct, and places a claim on the rest of the codebase to satisfy it.

---

## Reading Namespace Code

### Step 1: Find the taxonomy

Grep for namespace root constants:

```
grep -rn '_namespace\s*=' src/
```

The convention is to anchor each module's subtree to a named constant:

```javascript
const combatJournal_namespace  = "context.projects.combatJournal"
const webApplication_namespace = "context.modules.webApplication"
const moduleSystems_namespace  = "context.modules.moduleSystems"
```

This gives you the full domain taxonomy before reading any logic. Each constant is a module boundary. The constant name is a mental handle — it names the concept in the domain, not just a path string. Names are always fully descriptive; never abbreviated.

### Step 2: Read the handler preamble

A consistent pattern in namespace codebases is a **preamble** at the start of each handler — a block of `getMustExist` calls that establishes every invariant the handler needs before any business logic runs:

```javascript
// From real production code — a user-gated API endpoint:

let webHookCollectionNamespace    = "context.interactivecontext.webHookCollection";
let webHookCollection             = namespace.getMustExist(context, webHookCollectionNamespace);

let incomingRequest               = namespace.getMustExist(webHookCollection, "incomingRequest");
let incomingRequestURLBySlashList = namespace.getMustExist(webHookCollection, "incomingRequestURLBySlashList");
let pathItem_generator            = namespace.getMustExist(webHookCollection, "pathItem_generator");

let combatJournal_namespace       = "context.projects.combatJournal";
let combatJournal                 = namespace(context, combatJournal_namespace);

let configurationFromDisk         = namespace.getMustExist(combatJournal, "configurationFromDisk");
let appConfig                     = namespace.getMustExist(configurationFromDisk, "appConfig");
let supabaseConfig                = namespace.getMustExist(configurationFromDisk, "supabase");

const moduleSystems_namespace     = "context.modules.moduleSystems";
const loadedModules               = namespace.getMustExist(context, moduleSystems_namespace+".loadedModules");

let userData                      = namespace.getMustExist(combatJournal, "userData");
let userProfileData               = namespace.getMustExist(userData, "userProfileData");
```

Everything after this block can proceed without guards — the preamble has established that all required context exists. If any of these fail, the error is precisely located and immediately meaningful.

### Step 3: Read assertions for flow

From real production code — three fragments of the same request lifecycle:

**Fragment A — initialization boundary (config loading):**
```javascript
// getIfExists + isNotFound = "I don't know yet — initialize if absent"
let configurationFromDisk = namespace.getIfExists(combatJournal_runtimeState, "configurationFromDisk");

if (namespace.isNotFound(configurationFromDisk) || reloadConfig_boolean === true) {
  configurationFromDisk = namespace.setValue(
    combatJournal_runtimeState,
    "configurationFromDisk",
    JSON.parse(fs.readFileSync("./credentials/projects/combatJournal/config.json")),
    { overwrite: true }
  );
}
```

**Fragment B — downstream handler (default response):**
```javascript
// getMustExist throughout = "everything was established upstream"
let webHookCollection = namespace.getMustExist(context, webHookCollectionNamespace);
let incomingRequest   = namespace.getMustExist(webHookCollection, "incomingRequest");
let combatJournal     = namespace.getMustExist(context, combatJournal_namespace);
```

**Fragment C — user-gated endpoint (business logic):**
```javascript
// Required request fields — must exist or throw
const timezoneData = namespace.getMustExist(incomingRequest, "body.timezoneData");
const entryText    = namespace.getMustExist(incomingRequest, "body.entryText");

// Optional request fields — default to null if absent
const moodLevel    = namespace.leafNode(incomingRequest, "body.moodLevel",   null);
const energyLevel  = namespace.leafNode(incomingRequest, "body.energyLevel", null);
const stateVector  = namespace.leafNode(incomingRequest, "body.stateVector", null);

// User-gating assertion — specifies that auth middleware must have run
const supabaseUserUUID = namespace.getMustExist(incomingRequest, "user.id");

// Building the response forward
namespace.setValue(responseBody, "results."+toolbarAction, journalEntriesById);
namespace.setValue(responseBody, "results.writingTips",    writingTips);
```

**What the assertions tell you across all three fragments:**

- Fragment A `getIfExists` + `isNotFound` → initialization boundary; something is being established for the first time
- Fragment B `getMustExist` throughout → downstream; invariants were established earlier in the lifecycle
- Fragment C preamble of `getMustExist` → handler entry; all required context must exist before business logic
- Fragment C `getMustExist` on `"user.id"` → specifies that authentication happened upstream — the assertion is a claim on the auth middleware
- Fragment C `leafNode(..., null)` for optional fields → optional request data; safe to be absent
- All three fragments define `combatJournal_namespace` locally — each is self-contained in naming, all refer to the same subtree

You can reconstruct the lifecycle order, the authentication model, and the data flow from the assertion types alone.

### Step 4: Understand the NotFound distinction

`getIfExists` returns `namespace.NotFound` (not `undefined`) when a path doesn't exist.

This distinguishes:
- **Path not found** → `namespace.isNotFound(result)` is true → *no signal was placed here*
- **Path found, value is `undefined`** → `result === undefined` → *something set this explicitly*
- **Path found, value is `false` / `0` / `null`** → truthy checks would wrongly treat this as absent

This matters at boundaries: API validation, config loading, partial updates, form data.

---

## Writing Namespace Code

### Always anchor with a descriptive constant

```javascript
const combatJournal_namespace = "context.projects.combatJournal"
```

Every namespace call in the module uses this constant as the root. The name is part of the taxonomy — descriptive, never abbreviated. This makes the module's data footprint greppable and refactorable in one place.

### Write the preamble first

At the start of any handler or function with multiple dependencies, establish all invariants upfront with `getMustExist` before any branching logic:

```javascript
const invoicing_namespace   = "app.services.invoicing"
const invoice               = namespace.getMustExist(appState, `${invoicing_namespace}.current`)
const billingConfig         = namespace.getMustExist(appState, `${invoicing_namespace}.config.billing`)
const authenticatedUser     = namespace.getMustExist(requestContext, "user.id")
```

If any of these fail, the error is immediate and precisely located. The rest of the function can proceed without guards.

### Match the assertion to your logical state

```javascript
// At a gate — you don't know yet
const userId = namespace.getIfExists(req.body, 'user.id')
if (namespace.isNotFound(userId)) {
  return res.status(401).json({ error: 'Not authenticated' })
}

// Inside the authenticated path — you have already proven it exists
const userProfile = namespace.getMustExist(userCache, `${users_namespace}.${userId}.profile`, {
  errorMessage: `No cached profile for user ${userId}`
})
```

### Required vs optional incoming data

```javascript
// Required — must exist or the request is invalid
const entryText    = namespace.getMustExist(incomingRequest, "body.entryText",    { errorMessage: "entryText is required" })
const timezoneData = namespace.getMustExist(incomingRequest, "body.timezoneData", { errorMessage: "timezoneData is required" })

// Optional — absent is valid, use null or a sensible default
const moodLevel    = namespace.leafNode(incomingRequest, "body.moodLevel",   null)
const energyLevel  = namespace.leafNode(incomingRequest, "body.energyLevel", null)
```

### Build response structure forward

Start with a minimal envelope, then write into it as processing succeeds:

```javascript
const responseBody = { success: false, statusCode: 400, errorMessage: "Bad Request" }

// ... validate and process ...

namespace.setValue(responseBody, "results."+actionName, resultData)
delete responseBody.errorMessage
responseBody.statusCode = 200
responseBody.success    = true
```

### Lazy initialization

```javascript
// getIfExists + isNotFound for initialize-once-with-optional-reload
let configurationFromDisk = namespace.getIfExists(runtimeState, `${app_namespace}.config`)
if (namespace.isNotFound(configurationFromDisk) || forceReload === true) {
  configurationFromDisk = namespace.setValue(runtimeState, `${app_namespace}.config`, loadFromDisk(), { overwrite: true })
}

// leafNode for simple initialize-once-never-overwrite
namespace.leafNode(webHookCollection, "appPath_list", [])
```

---

## Anti-Patterns

```javascript
// ❌ Optional chaining collapses the NotFound distinction
const port = config?.server?.port ?? 3000
// ✅
const port = namespace.getIfExists(config, 'server.port', { defaultValueToReturn: 3000 })

// ❌ Truthy check fails for 0, false, "", null
if (obj.retryCount) { ... }
// ✅
if (namespace.exists(obj, 'retryCount')) { ... }

// ❌ Manual nesting
if (!obj.a) obj.a = {}
if (!obj.a.b) obj.a.b = {}
obj.a.b.c = value
// ✅
namespace.setValue(obj, 'a.b.c', value)

// ❌ Abbreviated constant names destroy the conceptual handle
const cj_ns = "context.projects.combatJournal"
// ✅
const combatJournal_namespace = "context.projects.combatJournal"
```

---

## Quick Reference

| Situation | Function | What it specifies |
|-----------|----------|------------------|
| Must exist — proven upstream | `getMustExist` | "This must be here; upstream is responsible" |
| May or may not exist | `getIfExists` | "System handles both cases" |
| Branch on presence | `exists` | "Behaviour differs by presence, not truthiness" |
| Optional field with default | `leafNode(..., default)` | "Absent is valid; use this if so" |
| Initialize once | `leafNode` | "Create only if absent" |
| Lazy init with reload | `getIfExists` + `isNotFound` | "Create or refresh" |
| Build new structure | `setValue` | "Writing forward" |
| Intentional update | `setValue({ overwrite: true })` | "Explicit replacement" |
