# DEC-0004: Separate Entry Points for Node and Browser

**Context:** Need to support both Node.js and browser environments with potentially different capabilities (e.g., `util.inspect` in Node).

**Decision:** Provide separate entry files: `src/node.js` and `src/browser.js`, both importing from shared `src/core.js`.

**Alternatives considered:**
- Single file with runtime detection (`typeof window !== 'undefined'`) — simpler but bundles dead code
- Pure universal code with no platform features — loses useful Node debugging

**Rationale:**
- Allows Node build to use `util.inspect` for better error messages
- Allows browser build to stay smaller
- Modern bundlers (webpack, rollup, vite) respect package.json `browser` field

**Implications:**
- Slightly more complex build config
- Need to maintain parallel entry points
