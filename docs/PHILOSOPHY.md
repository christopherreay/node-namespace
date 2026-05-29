# Philosophy

## Writing Code in the Present Tense — Prescriptively

`namespace` is built around a single discipline: **at each point in your code, make a precise claim about what should be true here**.

Not a schema. Not a type declaration. A claim — specific to *this location in the execution flow* — about what the data must look like for this code to be correct.

```javascript
// At the gate: "the system should handle both cases — user present or absent"
if (!namespace.exists(req, 'user.id')) {
  return redirect('/login');
}

// Inside the protected route: "user.id MUST exist here — if it doesn't, something upstream is broken"
const userId = namespace.getMustExist(req, 'user.id');
```

The same path. Two different claims. Both prescriptive — each one specifies what *should* be true for the code to be correct at that moment.

This is not just documentation of what you know. It is a **specification of what must hold** — written at the point of use, distributed across the codebase.

## Assertions as Distributed Specification

You don't declare a schema once. You write code, and as you write each function, handler, and service, you assert what the data contract should be at that point.

When you write `getMustExist` in a new feature, you are not just describing your current knowledge. You are specifying an invariant: *for this feature to be correct, this path must exist here*. The rest of the codebase either already satisfies that invariant, or it needs to be updated to do so. The assertion is a claim the codebase must honour — and crucially, you can write it before the upstream code that satisfies it exists. The consuming code is written first; the assertion specifies what the implementation must provide.

This is what makes it possible to add non-trivial features confidently. You write the new code first, asserting what should be true at each point. The assertions become a distributed specification. Other call sites that establish, read, or modify the same paths are automatically in a relationship with your assertions — and if something is wrong, the failure is precisely located.

Over time, the full data contract *emerges* from the sum of all those assertions. It is always accurate, because each call site is the live truth about what should hold at that location in the program.

## The Constant Pattern

As namespaces accumulate, anchor your subtrees with named constants:

```javascript
const combatJournal_namespace = "context.projects.combatJournal"

// Throughout the module:
namespace.getMustExist(state, `${combatJournal_namespace}.currentSession`)
namespace.leafNode(state, `${combatJournal_namespace}.entries`, [])
namespace.getIfExists(state, `${combatJournal_namespace}.lastSaved`, { defaultValueToReturn: null })
```

This does three things:

1. **One place to refactor** — change the root path in one line and everything follows
2. **Greppable taxonomy** — grep for `_namespace =` to extract the full domain model of a codebase as a machine-readable index
3. **Module scoping** — makes clear what data belongs to what module

The constant name is not just a pointer to a string. It is a mental handle — the name of the concept in the domain. `combatJournal_namespace` means something. That meaning is why the paths are memorable: they are taxonomic. They mirror how you think about the domain, so they map onto memory naturally. This is also why names must always be fully descriptive — never abbreviated. An abbreviated name destroys the conceptual handle.

## Each Call Makes a Claim

A single namespace call specifies:

- **What** is being accessed (the path)
- **What subtree** it belongs to (via the constant)
- **What should be true about it** at this point in execution (the function)

`getMustExist` says: *this must exist here — I am specifying an invariant.*

`getIfExists` says: *this may or may not exist — the system should handle both.*

`leafNode` says: *this should be initialized; if it hasn't been, I am doing it now.*

`setValue` says: *I am building structure forward — this path should now exist.*

`exists` says: *the correct behaviour differs depending on presence — not on truthiness.*

Reading these at a call site, you understand the author's intent about what the world should look like at that moment — not just what they observed.

## Deep Trees Are Intentional

Paths like `context.projects.combatJournal.sessions.current.entries` are not verbose — they are taxonomic. The depth *is* the domain model. Each segment is a decision about what category this thing belongs to, and how it relates to its parent.

Because paths are deep, conflicts between parts of the codebase are rare. Two modules accidentally asserting different things about the same namespace path is unlikely when paths are specific. The tree self-organizes. It is rarely wrong, and when it is, it is easy to change: update the constant.

## NotFound Preserves Meaning

Most utilities return `undefined` for both "this path doesn't exist" and "this path exists but its value is undefined." That destroys a distinction that often matters.

```javascript
const result = namespace.getIfExists(obj, 'user.optedOut');

if (namespace.isNotFound(result)) {
  // The field was never set — we have no information about the user's preference
} else if (result === false) {
  // The field exists and is explicitly false — user has not opted out
} else if (result === undefined) {
  // The field exists but was set to undefined — unusual, but distinguishable
}
```

`namespace.NotFound` is a preserved bit. It keeps a distinction that normal code collapses — the difference between *no signal was placed here* and *a signal was placed here, and it was undefined*.

This matters most at boundaries: API validation, form processing, partial updates, config loading. Any place where the difference between "not provided" and "provided as null" is meaningful.

## The Development Loop

At every scale — configuration loading, API handling, stateful services, data pipelines — the pattern is the same:

1. **Name** the thing (choose a path that fits the taxonomy)
2. **Claim** (what should be true here? what must hold for this code to be correct?)
3. **Assert** (getMustExist, getIfExists, exists)
4. **Build** (setValue, leafNode)

`namespace` makes this loop cheap to run at any point in the code. You don't need to think about the whole schema. You think about *here*, and what should be true *now*. The specification accumulates across the codebase as you go.

## Single Return, Single Path

Every `return` statement inside a function is a branch that exits the execution tree. Code written after a `return` depends silently on every preceding condition — those conditions are invisible to a reader who starts from that point. The more early returns there are, the more silent gates you must hold in your head to understand any given line.

A single return at the end of a function means the function is a **straight path**. Every branch modifies state rather than exiting. You can read the whole function as a sequence of transformations on that state — what happened is written into the state, not encoded in which return path was taken.

The namespace `responseBody` pattern makes this natural:

```javascript
const responseBody = { success: false, statusCode: 400, errorMessage: "Bad Request" }

try {
  const userId = namespace.getMustExist(req, "user.id")
  const text   = namespace.getMustExist(req, "body.text", { errorMessage: "text is required" })
  const mood   = namespace.leafNode(req, "body.mood", null)

  const result = await query(...)

  namespace.setValue(responseBody, "data", result.rows[0])
  delete responseBody.errorMessage
  responseBody.statusCode = 201
  responseBody.success    = true

} catch (error) {
  responseBody.errorMessage = error.message
}

return res.status(responseBody.statusCode).json(responseBody)
```

The try/catch catches anything unexpected. The `responseBody` accumulates the story of what happened. The single return sends whatever state was reached. No invisible gates, no silent preconditions.

If there is a genuine semantic reason for an early exit — a meaningful phase boundary, a clearly different error domain — mark it heavily so a reader knows the structure is intentional, not accidental.

This applies equally to  and  inside loops. A  is a return from a loop: code after it (inside or outside the loop body) silently depends on whether the break was taken. When a break is genuinely required, make it impossible to miss:



The marking convention — heavy, visually weighted, indented to match the break — makes the exit a first-class visible thing. A reader scanning the loop cannot pass over it without seeing it. The same convention applies to .

The general principle: every exit from a code structure (, , ) creates an invisible assertion for anything that follows. In the common case, eliminate the exit by restructuring around state. When the exit is genuinely the right tool, make it visible.

This is the "build forward" model applied to control flow. Just as namespace paths accumulate the data contract across a codebase, the response body accumulates the story of a request across a function. Both are the same idea at different scales: state flows forward, and its shape at any point tells the full story of how it got there.
