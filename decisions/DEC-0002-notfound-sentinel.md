# DEC-0002: Preserve NotFound Sentinel Pattern

**Context:** Most "get path" utilities (lodash.get, optional chaining) return `undefined` for missing paths. This conflates "path doesn't exist" with "path exists but value is undefined".

**Decision:** Keep the `NotFound` frozen sentinel object and `isNotFound()` check.

**Alternatives considered:**
- Return `undefined` — simpler, matches ecosystem
- Return `Symbol.for('namespace.NotFound')` — could be unique per realm
- Throw on not found — too heavy for common case

**Rationale:**
- This is a key differentiator and core to the library's design
- Explicit is better than implicit (Zen of Python applies)
- Allows storing `undefined` as a valid value at a namespace path

**Implications:**
- Users must check `isNotFound(result)` rather than `result == null`
- Document clearly in README with examples
