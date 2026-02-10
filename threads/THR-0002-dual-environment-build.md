# THR-0002: Dual-Environment Build

## Summary bullets
- Ship a single file that works in Node.js (CJS + ESM) and browsers (global + ESM + UMD)
- No dependencies means no bundler required for users
- Build process should be minimal — ideally zero-config or a single rollup/esbuild pass
- Must preserve the `eval` usage for dynamic default creation (used in legacy `defaultList` feature)

## Unknowns / Questions
- Use Rollup, esbuild, or hand-written UMD wrapper? (Decision: Rollup for ecosystem familiarity)
- Single entry point with runtime environment detection, or separate builds? (Decision: separate builds cleaner)
- Should we offer a "modern" build (ES2020) and "legacy" build (ES5)?

## Axes / dimensions
| Axis | Options | Considerations |
|------|---------|----------------|
| Module format | UMD, ESM, CJS | Need all three for maximum compatibility |
| Environment detection | Runtime check (`typeof window`) | Simpler than separate builds, but slightly larger |
| Build tool | Rollup, esbuild, tsc | Rollup has best UMD support |
| Polyfills | None, util.inspect, etc. | Avoid Node-specific APIs in browser build |

## Decisions
- **DEC-0003:** Use Rollup for bundling — best-in-class UMD support
- **DEC-0004:** Separate entry files for Node vs Browser — cleaner than runtime branching
- **DEC-0005:** No external dependencies in browser build — inline minimal `util.inspect` equivalent if needed

## Evidence / Sources
- Node.js ESM/CJS dual-package hazards docs
- Current browser code already has `util` polyfill

## Next actions
- [ ] Set up Rollup config with UMD + ESM outputs
- [ ] Create `src/namespace.js` (universal core)
- [ ] Create `src/browser.js` and `src/node.js` entry points
- [ ] Test in both environments
