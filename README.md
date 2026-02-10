# namespace

Zero-dependency dotted-path namespace utilities for JavaScript. Auto-vivification, NotFound sentinel, and safety-by-default design.

Works identically in **Node.js** and **browsers**.

## Install

```bash
npm install @namespace-js/core
```

## Quick Start

```javascript
import namespace from '@namespace-js/core';
// or: const namespace = require('@namespace-js/core');

// Auto-vivification: creates intermediate objects automatically
const config = {};
namespace(config, 'database.connections.primary');
// config is now: { database: { connections: { primary: {} } } }

// Set values safely (refuses to overwrite by default)
namespace.setValue(config, 'server.port', 3000);
// namespace.setValue(config, 'server.port', 8080); // Throws! Already exists
namespace.setValue(config, 'server.port', 8080, { overwrite: true }); // OK

// Check existence without creating
if (namespace.exists(config, 'server.host')) {
  console.log('Host is configured');
}

// Get with fallback
const port = namespace.getIfExists(config, 'server.port', {
  defaultValueToReturn: 8080
});

// Require existence with custom error (great for API validation)
const apiKey = namespace.getMustExist(process.env, 'API_KEY', {
  errorMessage: 'Configuration error: API_KEY environment variable is required'
});
```

## Why namespace?

### 1. NotFound Sentinel (Not `undefined`)

Most libraries return `undefined` for missing paths. This conflates "not found" with "found undefined":

```javascript
// With lodash:
const result = _.get(obj, 'path');
if (result == null) { /* is it missing or explicitly null? */ }

// With namespace:
const result = namespace.getIfExists(obj, 'path');
if (namespace.isNotFound(result)) {
  // Definitely not found (not set at all)
} else if (result === undefined) {
  // Found, but value is explicitly undefined
}
```

### 2. Safety by Default

```javascript
// Won't clobber existing data accidentally
namespace.setValue(obj, 'existing.path', 'new value'); // Throws if exists!
namespace.setValue(obj, 'existing.path', 'new value', { overwrite: true }); // Explicit opt-in
```

### 3. Safe Defaults with `leafNode`

```javascript
// Initialize only if not exists (idempotent)
const cache = namespace.leafNode(app, 'cache.users', new Map());
// cache is app.cache.users — creates Map only if didn't exist
```

## API

### `namespace(object, address, defaultList?, checkExists?)`

Get or create a namespace path, auto-vivifying intermediate objects.

```javascript
namespace({}, 'a.b.c');        // Returns {} and creates { a: { b: { c: {} } } }
namespace(obj, 'a.b.c', null, true);  // Returns NotFound if doesn't exist
```

### `namespace.getIfExists(object, address, options?)`

Get value or return `NotFound` sentinel.

```javascript
namespace.getIfExists(obj, 'a.b');
namespace.getIfExists(obj, 'a.b', { defaultValueToReturn: 'fallback' });
```

### `namespace.getMustExist(object, address, options?)`

Get value or throw error.

```javascript
namespace.getMustExist(obj, 'required.config');
namespace.getMustExist(obj, 'required.config', {
  errorMessage: 'Custom validation error for API'
});
```

### `namespace.exists(object, address)`

Check if path exists.

```javascript
if (namespace.exists(config, 'feature.enabled')) { ... }
```

### `namespace.setValue(object, address, value, options?)`

Set value at path. **Refuses to overwrite by default** (safety feature).

```javascript
namespace.setValue(obj, 'path', value);
namespace.setValue(obj, 'path', value, { overwrite: true });
namespace.setValue(obj, 'path', value, { dryRun: true }); // Validate only
namespace.setValue(obj, 'path', value, { ignoreErrors: true }); // Silent fail
```

### `namespace.remove(object, address)`

Remove value at path.

```javascript
namespace.remove(obj, 'a.b.c');
```

### `namespace.leafNode(object, address, leafValue)`

Get or create leaf value — safe for initialization.

```javascript
// Sets only if doesn't exist
const cache = namespace.leafNode(app, 'cache.users', new Map());
```

### `namespace.isNotFound(value)`

Check if value is the NotFound sentinel.

```javascript
const result = namespace.getIfExists(obj, 'maybe.missing');
if (namespace.isNotFound(result)) { ... }
```

### `namespace.join(...parts)`

Join path components with dots.

```javascript
namespace.join('a', 'b', 'c');           // 'a.b.c'
namespace.join('a', ['b', 'c']);         // 'a.b.c'
```

### `namespace.flatten(object)`

Convert nested object to flat map.

```javascript
namespace.flatten({ a: { b: 'c' } });    // { 'a.b': 'c' }
```

### `namespace.expand(flatObject)`

Reverse of flatten.

```javascript
namespace.expand({ 'a.b': 'c' });        // { a: { b: 'c' } }
```

## Browser Usage

### Script Tag (UMD)

```html
<script src="https://unpkg.com/@namespace-js/core/dist/namespace.umd.js"></script>
<script>
  const config = {};
  namespace(config, 'app.settings.theme', 'dark');
</script>
```

### ESM Import

```html
<script type="module">
  import namespace from 'https://unpkg.com/@namespace-js/core/dist/namespace.mjs';
  const config = {};
  namespace.setValue(config, 'app.ready', true);
</script>
```

## TypeScript

Full TypeScript definitions included:

```typescript
import namespace from '@namespace-js/core';

interface Config {
  server: { port: number };
}

const config: Config = {} as any;
const port = namespace.getIfExists(config, 'server.port', {
  defaultValueToReturn: 3000
});
```

## Design Philosophy

1. **Safety by default** — `setValue` refuses to overwrite unless explicitly told to
2. **Explicit > Implicit** — NotFound sentinel distinguishes "missing" from "undefined"
3. **Fail fast** — `getMustExist` throws with meaningful errors
4. **Zero dependencies** — No security concerns, tiny bundle size

## License

MIT
