# Threads protocol

Canonical files:
- Index: `docs/THREADS.md`
- Detail: `threads/THR-000X-<slug>.md`

## Minimal requirements

### docs/THREADS.md
For each primary thread:
- stable id: `THR-000X`
- title
- 1-sentence summary
- pointer to its detail file: `threads/THR-000X-<slug>.md`

Keep primary threads capped at ~5–12.

### threads/THR-000X-<slug>.md
Each thread detail file MUST contain:
- short summary bullets
- unknowns / questions
- pointers to evidence / decisions / sources (links)

Recommended (when relevant):
- **Axes / dimensions** (see “n-dimensional capture” below)
- **Next actions** (who/what/when)

## Decision capture policy (strong)
Decisions are not “notes”. If it changes scope/terms/structure, it must be recorded durably.

When a decision is made:
1. Create a decision record: `decisions/DEC-000X-<slug>.md`.
2. Link it from the relevant `threads/THR-*.md` under a **Decisions** section.
3. If it materially changes a primary thread summary, update the 1-sentence summary in `docs/THREADS.md`.

Decision records should be brief but complete:
- Context (what problem was being solved)
- Decision (what was chosen)
- Alternatives considered (1–3 bullets)
- Rationale (why)
- Implications / follow-ups (what now)
- Date + participants (if known)

## n-dimensional capture (don’t flatten)
Christopher’s core work includes an **n-dimensional programming language / substrate**. That kind of work doesn’t fit cleanly into a single linear narrative, so our thread tooling must preserve **multiple simultaneous dimensions** without losing structure.

Rule: **Threads are not “timelines”; threads are “coordinate spaces.”**

When a thread involves n-dimensional concepts, add an **Axes / dimensions** section to the thread detail file, capturing the independent “coordinates” that matter. Examples of axes:
- Semantics / meaning model
- Representation / notation
- Execution / runtime model
- Proof / verification angle
- Agent interaction / learning loop
- Integration surface (product, legal, comms)

Then, record artifacts as points in that space:
- Evidence/sources (links)
- Experiments/prototypes (paths/commits)
- Decisions (DEC links)
- Open questions (unknowns tied to a specific axis)

Practical benefits:
- We can make progress on one axis without pretending the others are resolved.
- Decisions remain locally coherent (DEC records) while the thread stays multi-dimensional.

## Update rules (avoid churn)
- Do NOT rewrite the whole index on every message.
- Update `docs/THREADS.md` only when:
  - a genuinely new primary thread appears, or
  - the summary of an existing thread materially changes, or
  - user explicitly asks for a refresh.
- Prefer adding detail to the per-thread file over bloating the index.
- Do not renumber THR ids once assigned.

## Thread update checklist (before committing changes)
- Did I avoid rewriting/reordering the whole `docs/THREADS.md`?
- Is the primary thread count still within ~5–12?
- Does every thread entry include a pointer to its `threads/THR-*.md` detail file?
- Did I keep each index summary to ~1 sentence?
- Did I add new detail to the per-thread file instead of bloating the index?
- If I created a new primary thread, is it clearly distinct (or did I just fragment an existing thread)?
- If this touched n-dimensional work: did I add/update the **Axes / dimensions** section instead of writing a long linear blob?

## Promotion rule
- New topics should attach to an existing primary thread by default.
- Promote to a new primary thread only by explicit user request or clear scope separation.
