# GOALS

## Mission
Create the definitive open-source namespace utility for JavaScript: a zero-dependency, dual-environment (Node.js + Browser) library that makes dotted-path object traversal and manipulation intuitive, safe, and expressive.

## Non-negotiables
1. **Zero runtime dependencies** — Pure JavaScript, no external packages
2. **Universal compatibility** — Works identically in Node.js (CommonJS + ESM) and browsers (script tag, ESM import, bundlers)
3. **Battle-tested semantics** — Preserve the `NotFound` sentinel pattern and auto-vivification behavior from 10+ years of production use
4. **TypeScript support** — Full type definitions included
5. **No build step for users** — Ship ready-to-use files, not "clone and build"
6. **MIT licensed** — Truly open source

## Definitions
- **Namespace** — A dotted string path like `"config.server.port"` that addresses a nested location within an object hierarchy
- **Auto-vivification** — Creating intermediate objects automatically when traversing a path that doesn't yet exist
- **NotFound sentinel** — A frozen singleton object used to distinguish "key exists but is undefined" from "key does not exist"
- **Traveller pattern** — Extensible options object passed through traversal operations
