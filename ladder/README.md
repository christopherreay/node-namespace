# Namespace refactoring ladder

One small program — a journal-entry submission handler — refactored through nine rungs. Each rung is a behaviour-preserving transformation. A single frozen test suite stays green at every rung. The behaviour never changes; only the expression climbs.

## The invariant rule

`test/invariant.test.js` is written once and never edited again. If a refactor turns a test red, the code is wrong — not the test.

## Rung table

| Rung | Directory | Verbs introduced | Complexity axis raised | Pain removed |
|------|-----------|-----------------|----------------------|--------------|
| 0 | `rung-0-plain` | none (plain JS) | — | Baseline: all assumptions implicit |
| 1 | `rung-1-tree` | `get`, `isNotFound`, `exists`, `setOrDefault`, `getOrDefault`, `set` | verb coverage | Truthiness existence checks; optional-chaining nil propagation; unnamed convergence |
| 2 | `rung-2-preamble` | `getMustExist` (post-converge assert) | contract density, failure positioning | Dependencies scattered through body; failure discovered downstream instead of located |
| 3 | `rung-3-required` | `getMustExist` (validation) | verb coverage, failure positioning | Imperative guard branches; error message separated from contract; forgotten guards invisible |
| 4 | `rung-4-convergence` | `setOverwrite`, namespace constants | route convergence | Branching per route; no structural signal for "converge here"; address strings repeated inline |
| 5 | `rung-5-forward` | position-as-fault pattern | failure positioning | Dual try/catch; error-type inspection; re-tagging faults after the fact |
| 6 | `rung-6-modules` | module originator/consumer pattern | multi-module coordination | Logic unsegregated; data flow opaque; no structural signal of who establishes vs who reads |
| 7 | `rung-7-batch` | `destructureMustExist` (PENDING RENAME) | batch contracts | Block of individual `getMustExist` calls; dependency list spread across lines |
| 8 | `rung-8-eval` | `toEval_bindMustExist` (PENDING RENAME) | scope bridge | Destructuring boilerplate when scope-binding is the point (experimental) |

## Running

**All rungs — invariant suite matrix:**
```
node ladder/run.js
# or
node ladder/run.js all
```

**Single rung — full test output:**
```
node ladder/run.js rung-0-plain
node ladder/run.js rung-3-required
# etc.
```

**Route-specific tests for rung 4:**
```
node --test ladder/rung-4-convergence/route.test.js
```

**Core library tests (unchanged by the ladder):**
```
node --test test/namespace.test.js
```

## Structure

```
ladder/
  namespace/lib.js            shared 8-verb implementation + two extensions
  support.js                  deterministic counter + spy for loadConfigFromDisk
  test/invariant.test.js      frozen behaviour spec — identical for every rung
  run.js                      runs invariant suite against one or all rungs
  rung-0-plain/
    handler.js
    NOTES.md
  rung-1-tree/
    handler.js
    NOTES.md
  rung-2-preamble/
    handler.js
    NOTES.md
  rung-3-required/
    handler.js
    NOTES.md
  rung-4-convergence/
    handler.js
    NOTES.md
    route.test.js             route-specific tests (not in invariant suite)
  rung-5-forward/
    handler.js
    NOTES.md
  rung-6-modules/
    configModule.js
    userModule.js
    entryModule.js
    handler.js
    NOTES.md
  rung-7-batch/
    handler.js
    NOTES.md
  rung-8-eval/
    handler.js
    NOTES.md
```
