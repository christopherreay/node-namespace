# THR-0003: TypeScript Support

## Summary bullets
- Full TypeScript declarations even though source is JavaScript
- Generic support: `namespace<T>(obj, "a.b")` should return typed result
- Path introspection (like `get(obj, "a.b")` knows the type of `obj.a.b`) is out of scope for v1 — too complex
- Method overloads for optional parameters

## Unknowns / Questions
- How to type the `NotFound` sentinel as a unique type?
- Should we ship a `.d.ts` file or convert source to TypeScript?

## Axes / dimensions
| Axis | Option A | Option B |
|------|----------|----------|
| Source language | JavaScript + .d.ts | TypeScript |
| Generic depth | Deep path typing | Root-level generic only |
| NotFound type | Branded type `NotFound` | const assertion |

## Decisions
- **DEC-0006:** Keep source as JavaScript, ship hand-written `.d.ts` — simpler build, easier to read
- **DEC-0007:** Root-level generic only — `namespace<MyType>(obj, path)` returns `MyType | NotFound`

## Next actions
- [ ] Write `types/index.d.ts`
- [ ] Add type tests with `tsd` or similar
- [ ] Document generic usage patterns
