# Feature: Hooks System for Namespace Functions

## Summary
Add a hooks system that allows users to register callback functions that execute before/after namespace operations (get, set, exists, etc.). This enables:
- Logging and debugging
- Validation
- Transformations
- Side effects (caching, persistence)
- Reactive updates

## Proposed API

### Registering Hooks

```javascript
// Global hooks (apply to all namespace operations)
namespace.hooks.before('setValue', (context) => {
  console.log(`Setting ${context.address} = ${context.value}`);
});

namespace.hooks.after('getIfExists', (context, result) => {
  console.log(`Got ${context.address}:`, result);
});

// Namespace-specific hooks (only for specific root objects)
namespace.hooks.before('setValue', myConfigObject, (context) => {
  // Only fires for operations on myConfigObject
});
```

### Context Object

Hooks receive a context object with:

```javascript
{
  operation: 'setValue',      // Which operation
  object: {},                 // The root object
  address: 'path.to.key',     // The dotted path
  value: 'newValue',          // For setValue (the value being set)
  options: {},                // Options passed to the operation
  ctx: {}               // The ctx object (for advanced use)
}
```

### Use Cases

#### 1. Validation Hook
```javascript
namespace.hooks.before('setValue', (ctx) => {
  if (ctx.address.startsWith('config.server')) {
    // Validate server config changes
    if (ctx.value.port < 1024) {
      throw new Error('Ports below 1024 require root privileges');
    }
  }
});
```

#### 2. Logging/Analytics
```javascript
namespace.hooks.after('setValue', (ctx, result) => {
  analytics.track('config_change', {
    path: ctx.address,
    timestamp: Date.now()
  });
});
```

#### 3. Transformation
```javascript
namespace.hooks.before('setValue', (ctx) => {
  // Auto-trim strings in certain paths
  if (ctx.address.includes('.name') && typeof ctx.value === 'string') {
    ctx.value = ctx.value.trim(); // Modify before setting
  }
});
```

#### 4. Caching Layer
```javascript
const cache = new Map();

namespace.hooks.before('getIfExists', (ctx) => {
  if (cache.has(ctx.address)) {
    ctx.skipOperation = true; // Skip the actual lookup
    ctx.returnValue = cache.get(ctx.address);
  }
});

namespace.hooks.after('setValue', (ctx) => {
  cache.set(ctx.address, ctx.value);
  cache.delete(ctx.address + '/*'); // Invalidate wildcards
});
```

## Implementation Considerations

### Hook Execution Order
1. Global before hooks (in registration order)
2. Object-specific before hooks
3. The actual operation
4. Object-specific after hooks
5. Global after hooks (in reverse registration order)

### Error Handling
- If a `before` hook throws, the operation is cancelled
- `after` hooks should not throw (or errors are caught and logged)

### Performance
- Hooks should be optional and have minimal overhead when not used
- Consider `Symbol` for internal hook storage to avoid pollution

### Hook Removal
```javascript
const unsubscribe = namespace.hooks.before('setValue', handler);
// Later...
unsubscribe(); // Remove the hook
```

## Related Patterns

This is inspired by:
- Express.js middleware
- Vue.js watchers/computed
- MobX reactions
- Proxy traps (but works without Proxy for broader compatibility)

## Acceptance Criteria

- [ ] `namespace.hooks.before(operation, handler)` API
- [ ] `namespace.hooks.after(operation, handler)` API
- [ ] `namespace.hooks.before(operation, object, handler)` for object-specific hooks
- [ ] Context object with operation details
- [ ] Ability to skip operation from before hook
- [ ] Ability to modify value in before hook
- [ ] Unsubscribe function returned from registration
- [ ] Tests for all hook types
- [ ] Documentation with examples

## Open Questions

1. Should we support async hooks?
2. Should we allow multiple hooks per operation, and if so, in what order?
3. Should hooks affect the ctx pattern internals?
4. Performance benchmarks needed?
