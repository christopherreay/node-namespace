# DEC-0001: Explicit Naming Over Abbreviations

**Context:** Legacy codebase uses terse abbreviations (`rm`, `cp`, `ls`) common in Unix/Perl traditions.

**Decision:** Use explicit, full-word method names: `remove`, `copy`, `log`.

**Alternatives considered:**
- Keep abbreviations — matches legacy and Unix conventions
- Use both (aliases) — more API surface to maintain

**Rationale:**
- Open source projects serve diverse audiences; explicit names are more discoverable
- IDEs autocomplete makes length irrelevant
- Aligns with modern JS ecosystem (Map.has, not Map.hasKey)

**Implications:**
- Breaking change from legacy code
- Need migration guide for internal users
