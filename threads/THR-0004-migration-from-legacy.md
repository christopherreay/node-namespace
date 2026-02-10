# THR-0004: Migration from Legacy

## Summary bullets
- 10+ years of production code needs cleaning for OSS
- Remove experimental/unused features: `toEval_*`, `allMustExist`, `compareSlice`, `tween`, `iterate`
- Consolidate Node and browser implementations — they differ in `atRoot` vs `atApplication` patterns
- Remove Node-specific `util.inspect` dependency from shared code
- Clean up error message prefixes (`"@: ERROR: atSrc:"` → cleaner messages)

## Unknowns / Questions
- Is anyone using the `defaultList` with `eval` feature? (Decision: keep it, it's powerful)
- Should we preserve `ctx` pattern for extensibility? (Decision: yes, it's elegant)

## Axes / dimensions
| Axis | Legacy State | Target State |
|------|--------------|--------------|
| Code organization | Inline in larger files | Modular, tree-shakeable exports |
| Error prefixes | `"@: ERROR: atSrc: namespace:"` | `"namespace: "` or custom message |
| Global pollution | `atRoot`, `atApplication` attached to `this`/`self` | No globals, proper module exports |
| Dead code | `toEval_*`, deep copy with runtime namespace list | Removed for v1.0 |
| Eval usage | For dynamic default creation | Keep but isolate, document CSP implications |

## Decisions
- **DEC-0008:** Remove `toEval_*` helpers — too niche for core library
- **DEC-0009:** Remove `ctx.routerAsAService` references — application-specific code
- **DEC-0010:** Keep `eval` for `defaultList` feature — add CSP warning in docs

## Evidence / Sources
- Original files in `/sources/` directory
- ~30 methods in legacy → ~10 in v1.0

## Next actions
- [ ] Extract core from both implementations
- [ ] Identify and remove application-specific code
- [ ] Audit for Node-specific APIs that need polyfills
