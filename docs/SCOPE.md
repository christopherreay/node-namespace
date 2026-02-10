# SCOPE

## In scope (MVP)

### Core namespace operations
- `namespace(root, path, options)` — Get or create namespace, auto-vivifying intermediate objects
- `namespace.setValue(root, path, value, options)` — Set value at path
- `namespace.getIfExists(root, path, options)` — Get value or return `NotFound` sentinel (supports `defaultValueToReturn` option)
- `namespace.getMustExist(root, path, options)` — Get value or throw descriptive error (supports custom `errorMessage` option)
- `namespace.exists(root, path)` — Boolean check if path exists
- `namespace.remove(root, path)` — Delete value at path (was `rm`)
- `namespace.leafNode(root, path, defaultValue)` — Get or create leaf value only if not exists (safe defaults)
- `namespace.NotFound` — Frozen sentinel object for "not found" semantics
- `namespace.isNotFound(value)` — Check if value is the NotFound sentinel

### Utility functions
- `namespace.join(...parts)` — Join path components with dots
- `namespace.flatten(object)` — Convert nested object to flat `{ "a.b.c": value }` format
- `namespace.expand(flatObject)` — Reverse of flatten

### Environment support
- Node.js: CommonJS (`require`) and ESM (`import`)
- Browser: Global (`window.namespace`), ESM (`import`), and UMD (script tag)

### Type definitions
- Full TypeScript declarations for all exports

## Out of scope (for MVP)
- Advanced utilities: `venn`, `equals`, `deepCopy`, `compareSlice`, `tween`, `iterate`
- `toEval_*` functions (code generation helpers)
- `move`, `cp`, `contains`, `extend` operations
- `freezeEverything` utility
- Async/promise variants
- Proxy-based reactive namespaces

## Phases
- **Phase 1 (Now):** Core API, dual-environment build, TypeScript types, README, npm publish
- **Phase 2:** Extended utilities (flatten/expand advanced features, equals, deepCopy, venn)
- **Phase 3:** Performance optimizations, additional entry points, browser-specific builds

## Key Design Patterns
- **NotFound Sentinel:** Distinguishes "path not found" from "value is undefined" (see DEC-0002)
- **Options/Traveller Pattern:** Extensible options for customization (see DEC-0011)
  - `getMustExist`: `options.errorMessage` for custom validation errors
  - `getIfExists`: `options.defaultValueToReturn` for inline defaults
  - `setValue`: `overwrite`, `dryRun`, `ignoreErrors`, `debugging`
- **Auto-vivification:** Creates intermediate objects automatically when traversing new paths
- **leafNode:** Safe initialization — only sets value if path doesn't exist
