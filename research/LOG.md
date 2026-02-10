# Research Log

## 2026-02-10: Project Initialization

### Source Analysis
Received two legacy implementations:
1. **Node.js version** (`namespace-node-legacy.js`): ~800 lines, attached to `this.namespace`, uses `util.inspect` for debugging
2. **Browser version** (`namespace-browser-legacy.js`): Similar structure, attached to `atApplication` global, polyfills `util.inspect`

### Key Findings

**Core Innovation:** The `NotFound` sentinel pattern
- Uses `Object.freeze({namespaceFunctionConstant: "NotFound"})` as a sentinel
- Distinguishes "path doesn't exist" from "value is undefined/null"
- Most libraries (lodash, optional chaining) conflate these

**Traveller Pattern:**
- Options object passed through recursive traversal
- Allows hooks (`func`), debugging (`debugging: true`), dry runs
- Very extensible design, worth preserving

**Eval Usage:**
- Used in `defaultList` feature for dynamic object creation
- Example: `namespace(obj, "a.b", ["new Map()"])` creates Maps at leaves
- CSP concern for browser, but powerful feature

**Method Inventory (Legacy):**
- Core: `namespace`, `setValue`, `getIfExists`, `getMustExist`, `isNotFound`
- Extended: `rm`, `extend`, `flatten`, `venn`, `equals`, `deepCopy`, `move`, `cp`, `contains`
- Utilities: `joinDot`, `joinSlash`, `compareSlice`, `tween`, `iterate`
- Experimental: `toEval_*`, `allMustExist`, `deepCopyTraveller`

### Decisions Made
1. MVP scope: ~10 core methods (added `leafNode` for safe defaults)
2. Rename `rm` → `remove`, etc. for clarity
3. Separate Node/browser entry points
4. JavaScript + hand-written .d.ts (not TypeScript source)
5. Keep `NotFound` sentinel as key differentiator
6. **Preserve options pattern** — critical for API ergonomics:
   - `getMustExist` with `options.errorMessage` (custom validation errors)
   - `getIfExists` with `options.defaultValueToReturn` (inline defaults)
   - `setValue` with `overwrite`, `dryRun`, `ignoreErrors`, `debugging`
   
**Design Philosophy — Safety by Default:**
- `setValue` refuses to overwrite unless `overwrite: true` (explicit opt-in)
- Forces conscious choice to clobber data — prevents accidental overwrites
- `leafNode` for safe initialization (set only if not exists)

### Open Questions
- Should `setValue` support array paths `["a", "b"]` or just dot strings?
- Performance: benchmark against lodash.get for equivalent operations
- Test strategy: Node built-in test runner vs Jest/Vitest
