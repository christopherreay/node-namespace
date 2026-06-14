# namespace — Applied Philosophy

*A working document. Function names below are placeholders; the ideas are the point. Refine names after.*

---

## 0. The premise: make *this part* correct, *now*

> A namespace call is the act of **committing your present analysis of the system, as an executable assertion, at the moment of writing.** You look at the system as it stands right now, form a claim about what is true here — or about what you are now making true — and the verb pins that claim down: directly, concisely, clearly. So that *this part*, the part under your hands at this moment, is correct against the system as it actually is.

Everything below descends from that one act. The other ideas in this document — the lens property, decisions-on-the-line, the verb matrix — are not separate principles; they are what that act *requires* in order to be possible.

Two things this premise deliberately is **not**:

- It is **not** "the codebase uses one shared `context` object." That is one *pattern* the library permits, not what the library is for (see §0.2).
- It is **not** correctness against a finished end-state. The claim is relative to the system **as it is at this moment of change** — which is why you can author `getMustExist(context, "invoiceCalculator.rules.tax")` as a finished decision even when no code anywhere yet loads `tax`; authoring the line does not require having authored the loader. It is a correct expression of your present analysis ("by the point execution reaches here, the design says this is established"), and the runtime reports the instant your analysis and reality diverge. The call is a hypothesis about the system, made executable.

### 0.1 The analysis you are committing is usually *macro program flow*

What you are actually reasoning about when you pick a verb is **your position in the large-scale flow of the program** — often the large-scale flow *with respect to one namespace domain* (one subtree). "Do I know this exists here?" / "Do I know this does *not* exist yet?" are **macro-flow questions**: their answers come from understanding where this point sits in the program's overall progression relative to that domain, not from anything local.

This sorts the verbs by **how much macro-flow knowledge they encode** — a real dimension, not a stylistic one:

- **Flow-independent (the common case).** `write.ifAbsent` / `read.orDefault` tolerate *both* states and resolve them. They are correct **regardless of macro flow** — you reach for them precisely when you *don't* want to depend on where you are in the flow, or can't establish it. This is why the `ifAbsent` cell (today's `leafNode`, e.g. `write.ifAbsent(node, "items", [])`) is the one you write most often: it asserts nothing about flow, so it's safe everywhere.
- **Flow-dependent (the deliberate assertion).** `read.orThrow`, `write.toEmpty`, `write.toExisting`, `read.assertEmpty` are each correct **only relative to a position in macro flow you have analysed.** Knowing "this must already exist" or "nothing can have created this yet" *is* macro-flow knowledge. These verbs are how you commit that knowledge to the line. The places where you *know* something will not exist are specific to macro flow — which is exactly why the create-only verb is rarer than the flow-agnostic default.

So the verb choice is a readout of *how much you are claiming to know about the program's large-scale flow at this point.* The flow-agnostic verbs claim nothing; the definite verbs claim a position. That is the information the name carries.

### 0.2 Single-context is a *pattern, not the foundation*

The library implies **no** particular scope of sharing. It is a mechanism for path-addressed interaction with *any* object tree whose shape or existence you can't take for granted at the point of access. Using one `context` for a whole codebase is a layered-on decision:

- **Good** for bounded, deliberate blackboards — request-scoped state, a plugin/module host needing a shared coordination surface. Bounded lifetime; the verbs make the shared mutation safe-per-touch.
- **Bad** as a default for large internal state — it is a god-object with no encapsulation boundary, where system-level coupling becomes discoverable only by grepping coordinates. The verbs keep each *touch* honest; they do nothing about *everything-reaching-everything* at the macro scale.

The library is better for staying agnostic on this. Choosing the sharing scope is *your* macro-flow decision, made per system — not something the tool should bake in.

---

## 1. What namespace is — and the hard line of what it is *not*

**namespace is a lens you look *through*, not a thing that lives *in* what you look at.**

It provides precise operations for interacting with a tree of plain objects: locate a path, assert something is (or isn't) true about it, place a value there. That is the whole job.

**The hard line:** namespace does **not** shape the code that uses it. It is not an abstraction layer over the host language. It does not impose an architecture, a lifecycle, an order of execution, or a control-flow style. The behaviour around it stays pure, ordinary, fully Turing-complete code — free to do whatever it wants. namespace governs *how you reach into the address space*, and is silent about everything else.

This matters because the temptation, once the tree feels powerful, is to grow a framework on top of it (dependency graphs, emergent ordering, resident handles, "the tree as the architecture"). Resist all of it. The value is precisely that namespace is *small and blind*: it coordinates access to shared state and then gets out of the way.

---

## 2. The core property: functions applied to data, never resident in it

This is the property that makes the whole idea clean, and the one to protect above all others.

```
namespace.<verb>(tree, "a.b.c", ...)   // a verb APPLIED to data
```

- The verb is a **transient operation**. It runs, returns, and vanishes.
- The tree stays a **plain object** — `{}` all the way down. Inspectable, serializable, identical to what any other code expects. Nothing about the library is *resident* in your data.
- Meaning lives **at the call site**, in the choice of verb — never inside an object.

**The rejected alternative** (a `scope`/handle that binds the library onto a sub-object) fails this property: it puts a library-bound *noun* into your data structures, makes the data no longer plain, and — worse — moves the "what tree is this rooted at?" decision *off the line* to wherever the handle was created. (See §4: that is the cardinal sin.)

> The data is opaque to the functions; the functions are absent from the data. The seam between them is clean, which is exactly why each side can vary without disturbing the other.

---

## 3. Inert from one perspective, live from the other

"The data is inert" is precise only with its qualifier: **inert *from the perspective of the namespace functions*.** The functions are semantically *blind* — they locate, assert, and place; they never interpret what anything means. That blindness is the enabling condition, not a limitation: a coordinate system has to be dumb about meaning, or it couldn't be shared by behaviours that agree on nothing except where things live.

Two halves, with namespace as the seam:

| side | owns | stance |
|---|---|---|
| **address + contract** (namespace) | *where* a thing lives (the path) and *what must be true* about it there (the verb) | semantically blind |
| **semantic + behaviour** (your code) | *what the data means* and *what to do with it* | namespace says nothing about this |

They stay orthogonal only because the seam refuses to let them fuse.

---

## 4. The cost model — what actually makes code expensive

> **The cost of a line is the number of decisions a reader must reconstruct to understand or change it. Not its token count. Not its character count.**

Names and structure exist for one purpose: to make the decisions a line depends on **legible at that line**, to the agent who will later change it.

Consequences:

- **Verbosity that restates a needed decision is free.** Repeating `namespace.read.orThrow(combatJournal_node, "userData")` across a module is not waste — each call carries *every decision it depends on, on its own line*: the library, the tree, the path, the existence-contract. Nothing to reconstruct from elsewhere.
- **Brevity that hides a decision is expensive.** Anything that moves a decision off the line — a bound handle, a destructured shortcut, an option that silently flips behaviour — forces the modifier to go rebuild that decision before they can safely touch the line.
- **Locality of decision is the master metric.** A design choice is good exactly to the degree that *every decision a line depends on is reconstructable from that line alone.*

### 4.1 The orientation that drives this: changing code, not finished code

Most tools optimise the **read-the-finished-artifact** path — terse, dense, clever, read-once. They assume the code is done.

This library optimises the **change-the-living-artifact** path. Development is *always* about changing code. The line's real job is not only "execute correctly" but "be safely modifiable by someone who must first rebuild the decisions behind it." Under that goal, every hidden decision is a landmine, and repetition that re-states a decision *at the site of change* is the tool doing its job.

This is why §2 (plain data, external verbs) is the maximally-changeable design: a plain tree has **no hidden behavioural decisions baked into the substrate** — every decision sits in the verb at the call site you are looking at.

---

## 5. The verbs — committed API

Two coordinates, both on the face of every name:

- **operation** — `get` (never writes) / `set` (always writes). The mutation bit is the **first token**, so "does this line change the tree" is answered at a glance.
- **assertion** — the contract this call levies on the rest of the codebase: *bare* (none) · `MustExist` · `MustEmpty` · `OrDefault`.

| | name | the contract it states | writes? |
|---|---|---|---|
| **READ** | `get` | none — returns the value, or the `NotFound` sentinel to branch on | no |
| | `getMustExist` | "present here" — throw if missing | no |
| | `getMustEmpty` | "empty here" — throw if present | no |
| | `getOrDefault` | none — the value, else the stand-in you pass (**no write**) | no |
| **WRITE** | `set` | "empty here" — create-only; throw if already present | yes |
| | `setMustExist` | "present here" — update-only; throw if absent | yes |
| | `setOrDefault` | converge — write the default if empty, keep if present, return whichever | if empty |
| | `setOverwrite` | none — write regardless of current state | yes |
| **TEST** | `exists` | path → bool | no |
| | `isNotFound` | value → bool (interprets `get`'s sentinel) | no |

### 5.1 The assertion is a *relational* claim, not a fact about the tree

`MustExist` is not a description of the data — it is a **requirement levied on other code**. It only means anything relative to some other piece of code obligated to satisfy it. So a single call already carries a relationship: it is one term of a contract with the rest of the codebase. `getMustExist(combatJournal, "configurationFromDisk")` says *"prior code was required to establish this; I depend on that requirement."* `set` (create-only) says *"this is the sole creation site; nothing reaching here may already have created it."* `setOrDefault` says *"many routes converge here and I tolerate that."*

Crucially the modal is **causally and temporally agnostic**: "must exist *here*" names the obligation without naming *which* code discharged it or *when*. That is the sweet spot — **maximally relational, minimally coupled.** You can change which upstream satisfies the requirement, or have several routes satisfy it, without touching the assertion. Naming the responsible upstream on the verb would re-introduce the coupling and ordering the design works to factor out; that information, if ever needed, belongs on the domain constant (§6), never the call.

### 5.2 The rotated mirror — why the set is closed

Every assertion exists on **both** operations. Pair them by *contract*, not by spelling:

| assertion | read | write |
|---|---|---|
| none | `get` | `setOverwrite` |
| empty | `getMustEmpty` | `set` |
| present | `getMustExist` | `setMustExist` |
| converge | `getOrDefault` | `setOrDefault` |

What "rotated" — and the principle underneath it — is **which operation gets the bare, unmarked verb: the bare verb is the *safe* operation for that operation's risk.** Reading is harmless, so the safe read (`get`) assumes nothing. Writing is destructive, so the safe write (`set`) refuses to clobber — it is create-only. The dangerous write is therefore the long, loud `setOverwrite`; the dangerous read does not exist, so none is marked. "Mutation must be loud" falls out of the structure rather than being imposed on it. The set is closed because every (assertion × operation) cell is filled and the asymmetry is *meaningful*.

### 5.3 Two cells with caveats

- **`getMustEmpty` is symmetry-completing and rarely called directly.** It exists so the grid is total. In practice the "assert empty" moment is almost always *folded into the write* — `set` is already create-only and throws on a non-empty slot. Standalone `getMustEmpty` is the residual case where you want the empty-assertion as a **guard on its own line, before writing** — legitimate, uncommon, documented as such.
- **`getOrDefault`'s default is a required positional argument.** No silent `undefined` fallback. If you did not pass a stand-in, you wanted `get` (the sentinel) — this closes the one hole through which the old options-driven ambiguity could return.

### 5.4 The old auto-vivifying getter, relocated

`namespace(obj, "a.b.c")` (walk, create `{}` for missing segments, return the deepest node) is not a separate concept — it is **`setOrDefault(obj, "a.b.c", {})`, keeping the return**: "converge a place to work into existence, give me the node." The function the library was named after turns out to be one cell viewed as "give me a container."

---

## 6. Naming conventions (for code that uses namespace)

Two orthogonal, independently-greppable axes — the same two-coordinate shape as the data tree:

- **Domain axis** — camelCase head names *which* subtree: `combatJournal`, `moduleSystems`, `webHookCollection`.
- **Type/role axis** — an `_suffix` names *what kind of value the variable is* (the job a return type would do in a typed language):

| suffix | holds | outstanding obligation |
|---|---|---|
| `_namespace` | a dotted path string | — |
| `_node` | a live container/reference in the tree | — |
| `_value` | a settled, safe-to-use value | — |
| `_probed` | a value **or** the `NotFound` sentinel | **must be `isNotFound`-checked before use** |

`grep _node =` → every reference; `grep combatJournal` → the whole domain. The `_probed` row is special: the suffix encodes not just a type but an **unmet contract**, made visible at every use so a reader changing the line sees the obligation without tracing where the value came from.

**Hard rules:**
- **Never** two-letter / abbreviated variable names. Ever. (`cj_ns` is forbidden; `combatJournal_namespace` is the form.)
- Semantic camelCase, effectively always **two or more parts**, more when it sharpens meaning.

---

## 7. What this design deliberately refuses to do

A short list, because the refusals define the library as much as the features:

- It does **not** make the data anything other than plain objects.
- It does **not** put behaviour, types, or handles *into* the data.
- It does **not** prescribe, constrain, or generate the surrounding code.
- It does **not** impose execution order, lifecycle, or architecture.
- It does **not** let an option change which operation a call performs.
- It does **not** optimise for the finished artifact at the expense of the changeable one.

> namespace is a precise, blind, transient way to interact with a shared inert address space — and nothing more. Its restraint is the feature.

---

## 8. Status — settled vs. pending

**Settled (this document):**
- The premise (§0): make *this part* correct, now, against your present analysis of the system.
- The lens-not-noun property (§2) and the refusals (§7).
- The decisions-not-tokens / changing-not-finished cost model (§4).
- The eight point-contract verbs + two tests (§5), with the rotated-mirror principle and the `getMustEmpty` / `getOrDefault` caveats.
- The naming conventions for calling code (§6).

**Pending (named, not yet designed):** the legacy surface splits into six groups by *what each operates on*. Only the point-contract group is settled. The rest each need their own naming pass, in this register, and must **not** be forced into the `get`/`set` + modal grammar where they are not point contracts:

| group | operates on | members (legacy names) | status |
|---|---|---|---|
| **point contract** | (tree, one path) | the eight verbs + `exists` / `isNotFound` | **settled** |
| **batch contract** | (tree, many paths) | `destructureMustExist`, `allMustExist`, `getMustExistRM` | pending — heavily used (`destructureMustExist`); likely a batch marker on the matrix verbs |
| **scope bridge (eval)** | (tree, lexical scope) | `toEval_localVars_load` / `_store`, `toEval_allMustExist` (+helper) | pending — kept deliberately; the one group that *cannot* be an ordinary function (must be `eval`'d in the caller's scope). Powerful for deep tools |
| **tree shape** | (tree, region) | `extend`, `move`, `cp`, `rm`/`remove`, `flatten`, `expand`, `freezeEverything` | pending — region-level, different altitude |
| **tree diff** | (tree, tree) | `equals`, `venn`, `deepCopy`, `deepCopyTraversalContext`, `buildStateFromDeepCopy`, `extendObjectWithVennComplementOfTwo` | pending — binary; relationships between whole trees |
| **path algebra** | (string only) | `join` family, `tween`, `iterate` family, `isRootOf`, `compareSlice` | pending — no tree argument at all; candidate sub-module `namespace.path.*` |

Engine internals (`traverse`, `NotFound`) underlie the point group and are not user-facing.
