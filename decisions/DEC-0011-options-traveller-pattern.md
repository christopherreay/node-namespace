# DEC-0011: Options/Traveller Pattern for Extensibility

**Context:** Legacy code uses a "traveller" object passed through traversal operations. This provides hooks for debugging, dry runs, and custom behavior. User feedback emphasizes the value of options for API ergonomics.

**Decision:** Preserve the options pattern (traveller pattern) for extensibility. Key options:

- `getMustExist(object, path, options)` supports:
  - `options.errorMessage` — custom error message (useful for API validation)
  
- `getIfExists(object, path, options)` supports:
  - `options.defaultValueToReturn` — return this instead of `NotFound` sentinel
  
- `setValue(object, path, value, options)` supports:
  - `options.overwrite` — **explicit opt-in** to overwrite existing values (default: `false`)
  - `options.dryRun` — validate without making changes
  - `options.ignoreErrors` — fail silently instead of throwing
  - `options.debugging` — pause in debugger during traversal
  
**Safety-by-default design:** `setValue` throws if target exists unless `overwrite: true` is explicitly set. This creates a protective boundary — you must consciously choose to clobber existing data.

- `leafNode(object, path, defaultValue)` — standalone method for safe defaults

**Alternatives considered:**
- Remove options, use positional parameters only — simpler but less flexible
- Separate methods for each option combination — API bloat

**Rationale:**
- Options pattern is battle-tested in legacy code
- `errorMessage` customization is critical for API endpoints (one-liner validation with meaningful errors)
- `defaultValueToReturn` is cleaner than post-call `if (isNotFound(result))` checks
- `leafNode` pattern for safe initialization is extremely common

**Implications:**
- Slightly more complex function signatures
- Must document available options clearly
- TypeScript definitions need to capture option interfaces

## Usage Examples

```javascript
// API validation with custom error
const config = namespace.getMustExist(req.body, "config", {
  errorMessage: "Missing required 'config' in request body"
});

// Safe defaults with leafNode
const cache = namespace.leafNode(app, "cache.users", new Map());
// Only creates if doesn't exist — idempotent initialization

// Conditional default value
const port = namespace.getIfExists(config, "server.port", {
  defaultValueToReturn: 3000
});

// Explicit overwrite (safety by default)
namespace.setValue(config, "server.port", 8080);  // Throws if port already set
namespace.setValue(config, "server.port", 8080, { overwrite: true });  // OK, explicit
```
