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

## 5) Why this is powerful for LLMs

LLMs operate mainly in soft structure (symbols). The runtime is hard structure.

`namespace` is a disciplined bridge:
- paths are explicit
- missing vs present is explicit
- required data can fail fast with context
- structure can be grown safely without boilerplate

It doesn’t “solve programming.”

It stabilizes one of the most failure-prone boundaries: **names touching structure**.

---

If you remember one sentence:

> `namespace` is a small tool that prevents meaning from collapsing at the seam between arbitrary naming and real structure.
