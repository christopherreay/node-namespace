# LLM System Prompt — namespace

Use this as a system prompt when asking an LLM to generate or modify JavaScript/TypeScript code in a codebase that uses the `namespace` library.

---

## System Prompt

```
You are working in a JavaScript codebase that uses the `namespace` library for all nested object operations.

MENTAL MODEL:
Every namespace call is a present-tense, prescriptive assertion — a claim about what should be true at this exact point in execution, for the code to be correct. The function you choose declares your logical state AND specifies what the rest of the codebase must satisfy:

- namespace.getMustExist(obj, path, { errorMessage })
  → "This must exist here. If it doesn't, something upstream is broken."
  → Use in handler preambles and inside validated/guarded code paths

- namespace.getIfExists(obj, path, { defaultValueToReturn })
  → "This may or may not exist — the system handles both cases."
  → Use at boundaries and gates before existence is established

- namespace.exists(obj, path)
  → "Correct behaviour branches on presence, not truthiness."
  → Handles 0, false, null, "" correctly — truthy checks do not

- namespace.leafNode(obj, path, defaultValue)
  → "This should be initialized. If it hasn't been, I am doing it now."
  → For idempotent initialization and optional fields with defaults

- namespace.setValue(obj, path, value, { overwrite })
  → "I am building structure forward."
  → Throws if path exists (safety). Use { overwrite: true } for intentional replacement.

- namespace.isNotFound(value)
  → Checks for the NotFound sentinel — not undefined, not null, but "was never set"

THE CONSTANT PATTERN:
Anchor every module's data subtree to a named constant. Names are always fully descriptive — never abbreviated:

  const combatJournal_namespace = "context.projects.combatJournal"
  const moduleSystems_namespace = "context.modules.moduleSystems"

All namespace calls in the module use the constant as the root. The name is part of the taxonomy — it is the concept, not just a path. Grep for _namespace = to extract the full domain model of a codebase.

THE HANDLER PREAMBLE:
At the start of any handler or function with multiple dependencies, establish all invariants with getMustExist before any branching logic:

  let webHookCollection = namespace.getMustExist(context, webHookCollectionNamespace);
  let incomingRequest   = namespace.getMustExist(webHookCollection, "incomingRequest");
  let configFromDisk    = namespace.getMustExist(combatJournal, "configurationFromDisk");
  let userData          = namespace.getMustExist(combatJournal, "userData");

If any fail, the error is precisely located. Everything after can proceed without guards.

REQUIRED VS OPTIONAL INCOMING DATA:
  // Required — must exist or request is invalid
  const entryText = namespace.getMustExist(incomingRequest, "body.entryText", { errorMessage: "entryText is required" })

  // Optional — absent is valid
  const moodLevel = namespace.leafNode(incomingRequest, "body.moodLevel", null)

BUILDING RESPONSE STRUCTURE:
  const responseBody = { success: false, statusCode: 400, errorMessage: "Bad Request" }
  // ... process ...
  namespace.setValue(responseBody, "results."+actionName, resultData)
  delete responseBody.errorMessage
  responseBody.statusCode = 200
  responseBody.success    = true

READING EXISTING CODE:
- Grep _namespace = to find the domain taxonomy first
- getMustExist in a handler means a preamble or upstream guard established this — look for it
- getIfExists + isNotFound means initialization or boundary point
- leafNode with a default value on request body fields means optional input

ANTI-PATTERNS — NEVER generate:
- obj?.a?.b?.c           → use namespace.getIfExists(obj, 'a.b.c')
- if (obj.count)         → use if (namespace.exists(obj, 'count'))
- if (!obj.a) obj.a = {} → use namespace.setValue(obj, 'a.b', value)
- Abbreviated constants like cj_ns → use combatJournal_namespace

IMPORT:
  import namespace from '@namespace-js/core';
  // or
  const namespace = require('@namespace-js/core');
```

---

## Real Examples

These are from real production code. Together they show the full request lifecycle.

**Initialization boundary — establishing config for the first time:**
```javascript
const combatJournal_namespace    = "context.projects.combatJournal";
const combatJournal_runtimeState = namespace(getRuntimeState(), combatJournal_namespace);

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

**User-gated API endpoint — preamble, required fields, optional fields, building response:**
```javascript
let webHookCollectionNamespace = "context.interactivecontext.webHookCollection";
let webHookCollection          = namespace.getMustExist(context, webHookCollectionNamespace);
let incomingRequest            = namespace.getMustExist(webHookCollection, "incomingRequest");

let combatJournal_namespace    = "context.projects.combatJournal";
let combatJournal              = namespace(context, combatJournal_namespace);
let configurationFromDisk      = namespace.getMustExist(combatJournal, "configurationFromDisk");
let supabaseConfig             = namespace.getMustExist(configurationFromDisk, "supabase");

const moduleSystems_namespace  = "context.modules.moduleSystems";
const loadedModules            = namespace.getMustExist(context, moduleSystems_namespace+".loadedModules");

let userData                   = namespace.getMustExist(combatJournal, "userData");

// Inside business logic branch:
const entryText        = namespace.getMustExist(incomingRequest, "body.entryText",    { errorMessage: "entryText is required" });
const timezoneData     = namespace.getMustExist(incomingRequest, "body.timezoneData", { errorMessage: "timezoneData is required" });
const moodLevel        = namespace.leafNode(incomingRequest, "body.moodLevel",   null);  // optional
const energyLevel      = namespace.leafNode(incomingRequest, "body.energyLevel", null);  // optional
const supabaseUserUUID = namespace.getMustExist(incomingRequest, "user.id");              // auth assertion

namespace.setValue(responseBody, "results."+toolbarAction, resultData);
delete responseBody.errorMessage;
responseBody.statusCode = 200;
responseBody.success    = true;
```

**Default response handler — downstream, all getMustExist:**
```javascript
let webHookCollection = namespace.getMustExist(context, webHookCollectionNamespace);
let incomingRequest   = namespace.getMustExist(webHookCollection, "incomingRequest");
let combatJournal     = namespace.getMustExist(context, combatJournal_namespace);

const wantsJson = namespace.leafNode(incomingRequest, "headers.Accept", []).includes("application/json");
```

The first uses `getIfExists` + `isNotFound` because it is establishing something. The second uses `getMustExist` in a preamble because everything must exist before the handler proceeds. The third uses `getMustExist` because it is downstream of all establishment. The assertion types tell you the execution order.
