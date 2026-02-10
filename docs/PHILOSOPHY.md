# Philosophy (laid bare)

`namespace` is not a programming paradigm. It’s a boundary tool.

It lives at the seam between two kinds of structure:

## 1) Hard structure (the world of objects)

At runtime, JavaScript gives you an object graph: keys, values, references, mutation, identity.

That structure is *hard* in the sense that it behaves like physics:
- deterministic rules
- causal consequences
- constraints you cannot negotiate with by intention alone

If you reach into the graph at the wrong place, you get the classic error:
> “cannot read property of undefined”

## 2) Soft structure (the world of names)

Humans don’t hold the whole object graph in their heads. We hold **names** and **maps**.

A dotted path like:

- `"user.profile.name"`
- `"config.server.port"`
- `"graph.applicationsCollection"`

is soft structure: an *arbitrary symbolic network* that carries meaning.

It’s editable. It evolves. It’s artful. It’s a shared language.

## 3) The seam: where information lives

A dotted path is not the data — it’s an encoding of a traversal and an intention.

The central question at the seam is:

> Does this name correspond to structure that exists?

Most code collapses crucial distinctions at this seam by returning `undefined` for everything.

`namespace` refuses to collapse meaning.

### NotFound is a preserved bit

A missing path and a present-but-undefined value are different facts.

- missing path → *no signal was ever placed there*
- undefined value → *a signal was placed there, and it was undefined*

Most utilities return `undefined` for both and destroy that difference.

`namespace` keeps the distinction via a sentinel:

- `namespace.NotFound`
- `namespace.isNotFound(value)`

That one choice makes validation, merging, and partial updates far less ambiguous.

## 4) Safety is the default

`setValue` refuses to overwrite unless you explicitly opt in.

This is a design stance:
- accidental mutation is more common than intentional mutation
- the cost of a silent overwrite is higher than the cost of an explicit flag

So the default is a protective boundary.

## 5) The layers where this stays true (growth → interaction → reality)

The same boundary principle shows up at multiple scales.

### Layer A — Growing *into* a domain (design-time fluidity)

This is the phase where the schema is not yet fully known.

- You want to **sketch structure into existence** without ceremony.
- You want to **postpone commitment** until the domain has revealed itself.

What helps here:
- `namespace()` / `setValue()` let you grow structure as you discover it.
- `leafNode()` lets you establish defaults without clobbering later discoveries.
- `exists()` avoids mistakes caused by falsy-but-meaningful values.

### Layer B — Domain ↔ domain interaction (translation boundaries)

This is where different models negotiate meaning: APIs, storage schemas, third‑party services, other teams.

At boundaries you get mismatch:
- different naming conventions
- optional vs required disagreements
- version drift

What helps here:
- Dotted paths become a **translation surface** between shapes.
- `getMustExist({ errorMessage })` becomes contract enforcement.
- `flatten()` / `expand()` let you treat deep structure as an addressable keyspace (overlay, project, merge).

### Layer C — Domain ↔ reality (runtime concreteness)

This is where you touch live data: requests, DB rows, sensors, payments.

Reality is messy:
- fields missing
- fields present but null
- partial updates
- ambiguity around `undefined`

What helps here:
- `NotFound` preserves the difference between “missing” and “present-but-empty”.
- `getIfExists({ defaultValueToReturn })` enables graceful degradation.
- Safety-by-default `setValue` reduces silent corruption in long-lived state.

## 6) Why this is powerful for LLMs

LLMs operate mainly in soft structure (symbols). The runtime is hard structure.

`namespace` is a disciplined bridge:
- paths are explicit
- missing vs present is explicit
- required data can fail fast with context
- structure can be grown safely without boilerplate

It doesn’t “solve programming.”

It stabilizes one of the most failure-prone boundaries: **names touching structure**.

## 7) Ergonomics (should feel natural while typing)

A philosophy is only real if it survives contact with fingers on a keyboard.

This library is meant to *match the developer’s live design loop*:

- **Name** the thing (a path is the thought)
- **Probe** the shape (what exists? what’s missing?)
- **Harden** a decision (required vs optional)
- **Act** to grow/correct structure safely

So the API should read like a sentence the developer is already forming:

- “Get it if it exists, otherwise I’ll handle it” → `getIfExists(..., { defaultValueToReturn })`
- “This must exist; fail clearly” → `getMustExist(..., { errorMessage })`
- “Set this, but don’t stomp earlier meaning unless I say so” → `setValue(..., { overwrite: true })`
- “Initialize if absent; otherwise leave it alone” → `leafNode(...)`

The dotted path is the point where thought becomes structure. Keeping it explicit (and keeping `NotFound` distinct from `undefined`) prevents intent from collapsing into ambiguity.

## 8) The cybernetic angle (what the tool is really doing)

Cybernetics, at minimum, is about **regulation via feedback**: a system stays coherent by continuously comparing intention to reality and correcting.

`namespace` supports that regulation loop at the naming↔structure seam:

- **You propose** a name/path (soft structure).
- **You test** whether it corresponds to reality (`exists`, `getIfExists`, `NotFound`).
- **You enforce** a constraint when the system must be in a particular state (`getMustExist`).
- **You act** to grow or correct structure (`setValue`, `leafNode`, `remove`).

In other words: it makes it cheap to run the loop:

> model → probe → decide → write → re‑probe

Across layers (design, integration, runtime), the “core thing” is the same:

> preserving distinctions and making corrections at the boundary where symbols meet structure.

---

If you remember one sentence:

> `namespace` is a small tool that prevents meaning from collapsing at the seam between arbitrary naming and real structure.
