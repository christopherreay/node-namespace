# THR-0001: Core API Design

## Summary bullets
- Define the minimal namespace API surface for v1.0
- Preserve the `NotFound` sentinel pattern — this is a key differentiator from lodash/get and similar
- Auto-vivification behavior: `namespace({}, "a.b.c")` creates `{a:{b:{c:{}}}}`
- Rename cryptic shortcuts (`rm` → `remove`) for clarity
- Ensure all methods handle edge cases (null inputs, empty paths, non-object roots)

## Unknowns / Questions
- Should `setValue` return the set value (for chaining) or the traveller object? (Decision: return set value)
- ~~Should `getIfExists` support a default value parameter, or keep that in traveller options?~~ (Decision: `options.defaultValueToReturn` — consistent with traveller pattern)
- Is `exists` redundant with `!isNotFound(getIfExists(...))`? (Decision: keep it for ergonomics)
- Should `leafNode` be in MVP? (Decision: yes — extremely useful for safe defaults)

## Axes / dimensions
| Axis | Current State | Target State |
|------|--------------|--------------|
| API surface | ~30 methods in legacy | ~10 core methods in v1.0 |
| Naming | Abbreviated (`rm`, `cp`, `ls`) | Explicit (`remove`, `copy`, `log`) |
| Error handling | Throws with "@: ERROR:" prefix | Clean errors, optional custom messages via `options.errorMessage` |
| NotFound check | `isNotFound(value)` + `value === NotFound` | Same, plus `options.defaultValueToReturn` for `getIfExists` |
| Defaults pattern | `leafNode` buried in legacy | Promoted to core API for safe initialization |

## Decisions
- **DEC-0001:** Rename `rm` to `remove`, `cp` to `copy` — explicit is better than terse for OSS
- **DEC-0002:** Keep `NotFound` sentinel (not `undefined`) — preserves distinction between "unset" and "not found"

## Evidence / Sources
- Original Node.js implementation: `/sources/namespace-node.js`
- Original browser implementation: `/sources/namespace-browser.js`

## Next actions
- [x] Finalize method signatures with TypeScript-style definitions
- [ ] Document options patterns (traveller pattern for extensibility)
- [ ] Write API documentation with examples
- [ ] Implement core methods with full test coverage

## Options Pattern Examples

### `getMustExist` with custom error (API endpoint use case)
```javascript
const userConfig = namespace.getMustExist(req.body, "config", {
  errorMessage: "API Error: 'config' object is required in request body"
});
```

### `getIfExists` with default value
```javascript
const port = namespace.getIfExists(config, "server.port", {
  defaultValueToReturn: 3000
});
// Returns 3000 if path doesn't exist, instead of NotFound
```

### `leafNode` for safe defaults
```javascript
// Only sets if doesn't exist — safe for initialization
const cache = namespace.leafNode(app, "cache.users", new Map());
// cache is now app.cache.users, but won't overwrite existing
```
