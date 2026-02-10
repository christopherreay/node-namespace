# Feature: Event Listener System for Namespaces

## Summary
Add an event emitter pattern that notifies listeners when values change at namespace paths. This enables:
- Reactive UI updates
- State synchronization
- Side effect triggering
- Debug/audit logging
- Cross-module communication

## Proposed API

### Basic Usage

```javascript
const config = {};

// Listen to specific path
namespace.on(config, 'user.name', (newValue, oldValue, path) => {
  console.log(`User name changed from "${oldValue}" to "${newValue}"`);
});

// Listen to wildcard paths
namespace.on(config, 'user.*', (newValue, oldValue, path) => {
  console.log(`User property ${path} changed`);
});

// Listen to nested paths recursively
namespace.on(config, 'user.**', (newValue, oldValue, path) => {
  console.log(`Something in user changed: ${path}`);
});

// Make changes that trigger events
namespace.setValue(config, 'user.name', 'Alice');
// → triggers: User name changed from "undefined" to "Alice"
```

### Event Types

```javascript
// Value changed
namespace.on(config, 'path', 'change', handler);

// Value added (didn't exist before)
namespace.on(config, 'path', 'add', handler);

// Value removed
namespace.on(config, 'path', 'remove', handler);

// Any operation
namespace.on(config, 'path', 'any', handler);
```

### Event Object

```javascript
namespace.on(config, 'user.name', (event) => {
  console.log(event.type);      // 'change', 'add', 'remove'
  console.log(event.path);      // 'user.name'
  console.log(event.newValue);  // New value
  console.log(event.oldValue);  // Previous value (or NotFound)
  console.log(event.root);      // The root object (config)
});
```

### Wildcard Patterns

```javascript
// Single level wildcard
namespace.on(config, 'users.*.name', handler);
// Matches: users.0.name, users.1.name, users.alice.name

// Multi-level wildcard (recursive)
namespace.on(config, 'config.**', handler);
// Matches: config.server, config.server.port, config.database.url, etc.

// Multiple wildcards
namespace.on(config, '*.config.*', handler);
// Matches: app1.config.port, app2.config.host
```

### Unsubscribing

```javascript
const unsubscribe = namespace.on(config, 'user.name', handler);

// Later...
unsubscribe(); // Stop listening
```

### One-time Listeners

```javascript
namespace.once(config, 'user.id', (value) => {
  console.log('User ID set:', value);
  // Automatically unsubscribed after first trigger
});
```

## Use Cases

### 1. Reactive UI Updates
```javascript
const state = {};

namespace.on(state, 'ui.sidebar.open', (isOpen) => {
  document.getElementById('sidebar').classList.toggle('open', isOpen);
});

// Some action triggers the change
namespace.setValue(state, 'ui.sidebar.open', true);
// UI updates automatically
```

### 2. State Persistence
```javascript
namespace.on(appState, '**', debounce((event) => {
  localStorage.setItem('appState', JSON.stringify(appState));
}, 1000));
```

### 3. Cross-Module Communication
```javascript
// Module A: Authentication
namespace.setValue(sharedState, 'auth.user', user);

// Module B: UI (in different file)
namespace.on(sharedState, 'auth.user', (user) => {
  updateNavbar(user);
});
```

### 4. Validation with Rollback
```javascript
namespace.on(config, 'database.port', (event) => {
  if (event.newValue < 1024) {
    console.error('Invalid port, rolling back');
    namespace.setValue(config, 'database.port', event.oldValue, { overwrite: true });
  }
});
```

### 5. Audit Logging
```javascript
namespace.on(sensitiveData, '**', (event) => {
  auditLog.write({
    timestamp: Date.now(),
    path: event.path,
    operation: event.type,
    user: currentUser.id
  });
});
```

## Implementation Approaches

### Option 1: Proxy-based (Modern Browsers)
Use JavaScript Proxy to intercept all property access. Cleanest but requires ES6 Proxy support.

```javascript
function makeObservable(obj) {
  return new Proxy(obj, {
    set(target, prop, value) {
      const oldValue = target[prop];
      target[prop] = value;
      emitChange(path, value, oldValue);
      return true;
    }
  });
}
```

### Option 2: Wrapper Methods
Intercept through namespace methods only (no Proxy). Works everywhere but only catches changes made through namespace API.

```javascript
// In setValue, after setting:
emitEvent(object, address, 'change', value, oldValue);
```

### Option 3: Hybrid
Use Proxy if available, fall back to wrapper methods. Best compatibility.

## Performance Considerations

- Event matching for wildcards should use efficient pattern matching (trie structure?)
- Consider throttling/debouncing for high-frequency updates
- Option to batch events (emit all at end of tick)

## API Alternatives

### Alternative: Observer Pattern
```javascript
const observable = namespace.observe(config);
observable.on('user.name', handler);
```

### Alternative: Reactive API
```javascript
const state = namespace.reactive({});
state.user.name = 'Alice'; // Triggers events
```

## Acceptance Criteria

- [ ] `namespace.on(object, path, handler)` API
- [ ] `namespace.on(object, path, eventType, handler)` for specific events
- [ ] Wildcard support (`*` and `**`)
- [ ] Event object with type, path, newValue, oldValue
- [ ] `namespace.once()` for one-time listeners
- [ ] Unsubscribe function returned
- [ ] Works with all namespace operations (setValue, remove, etc.)
- [ ] Tests for event firing, wildcards, unsubscription
- [ ] Documentation with reactive patterns

## Open Questions

1. Should we support synchronous vs async handlers?
2. Should events bubble up? (e.g., change to `user.name` also fires `user.*` listeners)
3. Performance impact on large objects with many listeners?
4. Memory leaks with long-lived objects and forgotten listeners?
5. Should we include a `namespace.off()` method or rely on unsubscribe functions?
