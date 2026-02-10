# Using namespace as an LLM Lens

This directory contains resources for using namespace as a **conceptual framework** or **mental model** when generating code with LLMs.

## What's a "Lens"?

A lens is a way of seeing — a default pattern that shapes how you approach problems. The namespace lens means:

> **"When handling nested data, default to namespace patterns."**

Instead of thinking "how do I access this nested property?" you think "which namespace function should I use?"

## Quick Start

### 1. Use the System Prompt

Copy the prompt from [`SYSTEM_PROMPT.md`](./SYSTEM_PROMPT.md) and paste it as the first message when asking an LLM to generate code.

### 2. Use the Decision Framework

From [`LLM_LENS.md`](./LLM_LENS.md), the core decision tree:

| Question | Answer | Use |
|----------|--------|-----|
| Creating nested structure? | Yes | `namespace.setValue()` |
| Reading possibly-missing data? | Yes | `namespace.getIfExists()` |
| Data is required? | Yes | `namespace.getMustExist()` |
| Initializing cache/singleton? | Yes | `namespace.leafNode()` |
| Checking existence? | Yes | `namespace.exists()` |

### 3. Follow the Anti-Patterns

The lens explicitly tells LLMs what **not** to generate:
- No `?.` optional chaining
- No truthy checks for existence
- No manual object construction

## Files in This Directory

| File | Purpose | Use When |
|------|---------|----------|
| `LLM_LENS.md` | Complete conceptual guide | Understanding the philosophy |
| `SYSTEM_PROMPT.md` | Copy-paste system prompt | Using with ChatGPT, Claude, API |

## Real-World Usage

### With ChatGPT/Claude

1. Open a new chat
2. Paste the system prompt
3. Ask for code generation
4. The LLM will use namespace patterns automatically

### With Cursor

Add to your `.cursorrules`:

```
# Namespace Lens
Default to using @namespace-js/core for nested object operations.
See: https://github.com/christopherreay/node-namespace/blob/main/docs/SYSTEM_PROMPT.md
```

### With GitHub Copilot

Add a comment at the top of files:

```javascript
// Use namespace patterns for all nested object operations
// import namespace from '@namespace-js/core';
```

### Fine-Tuning

Use the examples in `SYSTEM_PROMPT.md` to create a fine-tuning dataset that teaches an LLM to prefer namespace patterns.

## Example: Before/After Lens

### Without Lens (Typical LLM Output)

```javascript
function getConfig(obj) {
  return {
    port: obj?.server?.port ?? 3000,
    host: obj?.server?.host ?? 'localhost'
  };
}

function initCache(app) {
  if (!app.cache) {
    app.cache = new Map();
  }
  return app.cache;
}
```

### With Lens (Namespace-Aware Output)

```javascript
import namespace from '@namespace-js/core';

function getConfig(obj) {
  return {
    port: namespace.getIfExists(obj, 'server.port', { defaultValueToReturn: 3000 }),
    host: namespace.getIfExists(obj, 'server.host', { defaultValueToReturn: 'localhost' })
  };
}

function initCache(app) {
  return namespace.leafNode(app, 'cache', new Map());
}
```

## Why This Matters

The lens approach means:

1. **Consistency** — All generated code follows the same patterns
2. **Safety** — Generated code handles edge cases correctly
3. **Clarity** — Error messages include full paths
4. **Maintainability** — One pattern for all nested operations

## Contributing

If you develop additional prompts, examples, or tooling for the namespace lens, please contribute them to this directory.

## See Also

- [Main README](../README.md) — Library documentation
- [AGENTS.md](../AGENTS.md) — AI agent usage patterns
- [Examples](../examples/) — Runnable code examples
