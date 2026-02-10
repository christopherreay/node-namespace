# DEC-0006: JavaScript Source with Hand-Written TypeScript Definitions

**Context:** Decision between TypeScript source or JavaScript + .d.ts files.

**Decision:** Keep implementation in JavaScript, ship hand-written TypeScript declarations.

**Alternatives considered:**
- TypeScript source — automatic type generation, but adds build complexity
- JSDoc types — less powerful than full TypeScript declarations

**Rationale:**
- Library is small enough to maintain .d.ts manually
- JavaScript is more readable for runtime debugging
- No TypeScript compiler dependency for contributors
- Type definitions can be more precise than inference (branded types, overloads)

**Implications:**
- Types and implementation can drift — need CI check
- Contributors may forget to update .d.ts
