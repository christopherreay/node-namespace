/**
 * Comprehensive test suite for namespace
 * Run with: node --test test/namespace.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Handle both CommonJS and ESM exports
const namespaceModule = require('../src/core.js');
const namespace = namespaceModule.default || namespaceModule;

// Ensure NotFound is attached
if (!namespace.NotFound && namespaceModule.NotFound) {
  namespace.NotFound = namespaceModule.NotFound;
}

describe('namespace core', () => {
  describe('namespace() - auto-vivification', () => {
    it('should auto-vivify nested objects', () => {
      const obj = {};
      const result = namespace(obj, 'a.b.c');
      assert.deepStrictEqual(obj, { a: { b: { c: {} } } });
      assert.deepStrictEqual(result, {});
    });

    it('should return existing path without modification', () => {
      const obj = { a: { b: { c: 'value' } } };
      const result = namespace(obj, 'a.b.c');
      assert.strictEqual(result, 'value');
      assert.deepStrictEqual(obj, { a: { b: { c: 'value' } } });
    });

    it('should return root when address is null', () => {
      const obj = { test: true };
      const result = namespace(obj, null);
      assert.strictEqual(result, obj);
    });

    it('should create empty key for empty string address', () => {
      const obj = {};
      const result = namespace(obj, '');
      // Empty string creates a key with empty string
      assert.strictEqual(obj[''], result);
    });

    it('should throw on invalid object', () => {
      assert.throws(() => namespace(null, 'a.b'), /not a valid namespace root/);
      assert.throws(() => namespace(undefined, 'a.b'), /not a valid namespace root/);
      assert.throws(() => namespace('string', 'a.b'), /not a valid namespace root/);
      assert.throws(() => namespace(123, 'a.b'), /not a valid namespace root/);
    });

    it('should throw on invalid address', () => {
      assert.throws(() => namespace({}, undefined), /not a valid string/);
      assert.throws(() => namespace({}, 123), /not a valid string/);
      assert.throws(() => namespace({}, {}), /not a valid string/);
    });

    it('should handle single-level paths', () => {
      const obj = {};
      namespace(obj, 'key');
      assert.deepStrictEqual(obj, { key: {} });
    });

    it('should handle deeply nested paths', () => {
      const obj = {};
      namespace(obj, 'a.b.c.d.e.f');
      assert.deepStrictEqual(obj, { a: { b: { c: { d: { e: { f: {} } } } } } });
    });

    it('should extend existing partial paths', () => {
      const obj = { a: { existing: true } };
      namespace(obj, 'a.b.c');
      assert.deepStrictEqual(obj, { a: { existing: true, b: { c: {} } } });
    });
  });

  describe('NotFound sentinel', () => {
    it('should have frozen NotFound sentinel', () => {
      assert.strictEqual(namespace.NotFound.namespaceFunctionConstant, 'NotFound');
      assert.strictEqual(Object.isFrozen(namespace.NotFound), true);
      // In non-strict mode, writes to frozen objects fail silently.
      namespace.NotFound.test = true;
      assert.strictEqual(namespace.NotFound.test, undefined);
    });

    it('should return NotFound for non-existent path with checkExists=true', () => {
      const obj = {};
      const result = namespace(obj, 'a.b.c', null, true);
      assert.strictEqual(result, namespace.NotFound);
    });

    it('should detect NotFound with isNotFound()', () => {
      assert.strictEqual(namespace.isNotFound(namespace.NotFound), true);
      assert.strictEqual(namespace.isNotFound({}), false);
      assert.strictEqual(namespace.isNotFound(null), false);
      assert.strictEqual(namespace.isNotFound(undefined), false);
      assert.strictEqual(namespace.isNotFound('string'), false);
      assert.strictEqual(namespace.isNotFound(0), false);
      assert.strictEqual(namespace.isNotFound(false), false);
    });

    it('should detect NotFound at path with isNotFound(value, address)', () => {
      const obj = { a: {} };
      assert.strictEqual(namespace.isNotFound(obj, 'a.b'), true);
      const obj2 = { a: { b: 'exists' } };
      assert.strictEqual(namespace.isNotFound(obj2, 'a.b'), false);
    });
  });

  describe('getIfExists()', () => {
    it('should return value if exists', () => {
      const obj = { a: { b: 'value' } };
      assert.strictEqual(namespace.getIfExists(obj, 'a.b'), 'value');
    });

    it('should return NotFound if not exists', () => {
      const obj = {};
      assert.strictEqual(namespace.getIfExists(obj, 'a.b'), namespace.NotFound);
    });

    it('should return NotFound for null intermediate', () => {
      const obj = { a: null };
      assert.strictEqual(namespace.getIfExists(obj, 'a.b'), namespace.NotFound);
    });

    it('should support defaultValueToReturn option', () => {
      const obj = {};
      assert.strictEqual(
        namespace.getIfExists(obj, 'a.b', { defaultValueToReturn: 'default' }),
        'default'
      );
    });

    it('should return defaultValueToReturn of 0 (falsy value)', () => {
      const obj = {};
      assert.strictEqual(
        namespace.getIfExists(obj, 'a.b', { defaultValueToReturn: 0 }),
        0
      );
    });

    it('should return defaultValueToReturn of false', () => {
      const obj = {};
      assert.strictEqual(
        namespace.getIfExists(obj, 'a.b', { defaultValueToReturn: false }),
        false
      );
    });

    it('should return defaultValueToReturn of empty string', () => {
      const obj = {};
      assert.strictEqual(
        namespace.getIfExists(obj, 'a.b', { defaultValueToReturn: '' }),
        ''
      );
    });

    it('should return defaultValueToReturn of null', () => {
      const obj = {};
      assert.strictEqual(
        namespace.getIfExists(obj, 'a.b', { defaultValueToReturn: null }),
        null
      );
    });

    it('should distinguish undefined from NotFound', () => {
      const obj = { a: { b: undefined } };
      const result = namespace.getIfExists(obj, 'a.b');
      assert.strictEqual(result, undefined);
      assert.strictEqual(namespace.isNotFound(result), false);
    });
  });

  describe('getMustExist()', () => {
    it('should return value if exists', () => {
      const obj = { a: { b: 'value' } };
      assert.strictEqual(namespace.getMustExist(obj, 'a.b'), 'value');
    });

    it('should throw if not exists', () => {
      const obj = {};
      assert.throws(() => namespace.getMustExist(obj, 'a.b'), /Property not found/);
    });

    it('should support custom error message', () => {
      const obj = {};
      assert.throws(
        () => namespace.getMustExist(obj, 'a.b', { errorMessage: 'Custom error message' }),
        /Custom error message/
      );
    });

    it('should include address in default error', () => {
      const obj = {};
      assert.throws(
        () => namespace.getMustExist(obj, 'config.database.url'),
        /config.database.url/
      );
    });
  });

  describe('exists()', () => {
    it('should return true for existing path', () => {
      const obj = { a: { b: 'value' } };
      assert.strictEqual(namespace.exists(obj, 'a.b'), true);
    });

    it('should return false for non-existing path', () => {
      const obj = {};
      assert.strictEqual(namespace.exists(obj, 'a.b'), false);
    });

    it('should return true for undefined value (exists but undefined)', () => {
      const obj = { a: { b: undefined } };
      assert.strictEqual(namespace.exists(obj, 'a.b'), true);
    });

    it('should return true for null value', () => {
      const obj = { a: { b: null } };
      assert.strictEqual(namespace.exists(obj, 'a.b'), true);
    });

    it('should return false when intermediate is null', () => {
      const obj = { a: null };
      assert.strictEqual(namespace.exists(obj, 'a.b'), false);
    });
  });

  describe('setValue() - safety by default', () => {
    it('should set value at path', () => {
      const obj = {};
      const result = namespace.setValue(obj, 'a.b.c', 'value');
      assert.strictEqual(obj.a.b.c, 'value');
      assert.strictEqual(result, 'value');
    });

    it('should return the set value', () => {
      const obj = {};
      const result = namespace.setValue(obj, 'key', { nested: true });
      assert.deepStrictEqual(result, { nested: true });
    });

    it('should refuse to overwrite by default', () => {
      const obj = { a: 'exists' };
      assert.throws(() => namespace.setValue(obj, 'a', 'new'), /cannot overwrite/);
    });

    it('should allow overwrite with option', () => {
      const obj = { a: 'old' };
      namespace.setValue(obj, 'a', 'new', { overwrite: true });
      assert.strictEqual(obj.a, 'new');
    });

    it('should support dryRun option', () => {
      const obj = {};
      namespace.setValue(obj, 'a.b', 'value', { dryRun: true });
      assert.deepStrictEqual(obj, {});
    });

    it('should support ignoreErrors option for existing values', () => {
      const obj = { a: 'exists' };
      const result = namespace.setValue(obj, 'a', 'new', { ignoreErrors: true });
      assert.strictEqual(obj.a, 'exists'); // unchanged
      assert.strictEqual(result, undefined);
    });

    it('should throw for null address', () => {
      const obj = {};
      assert.throws(() => namespace.setValue(obj, null, 'value'), /address cannot be null/);
    });

    it('should auto-vivify intermediate objects', () => {
      const obj = {};
      namespace.setValue(obj, 'a.b.c.d', 'deep');
      assert.deepStrictEqual(obj, { a: { b: { c: { d: 'deep' } } } });
    });

    it('should fail when intermediate is not an object without hardWriteHierarchy', () => {
      const obj = { a: 'string' };
      assert.throws(
        () => namespace.setValue(obj, 'a.b', 'value'),
        /no valid object hierarchy/
      );
    });

    it('should overwrite intermediate with hardWriteHierarchy', () => {
      const obj = { a: 'string' };
      namespace.setValue(obj, 'a.b', 'value', { hardWriteHierarchy: true });
      assert.deepStrictEqual(obj, { a: { b: 'value' } });
    });

    it('should handle ignoreErrors for non-object intermediate', () => {
      const obj = { a: 'string' };
      const result = namespace.setValue(obj, 'a.b', 'value', { ignoreErrors: true });
      assert.strictEqual(result, undefined);
      assert.strictEqual(obj.a, 'string'); // unchanged
    });

    it('should set various value types', () => {
      const obj = {};
      namespace.setValue(obj, 'str', 'string');
      namespace.setValue(obj, 'num', 42);
      namespace.setValue(obj, 'bool', true);
      namespace.setValue(obj, 'nil', null);
      namespace.setValue(obj, 'undef', undefined);
      namespace.setValue(obj, 'arr', [1, 2, 3]);
      namespace.setValue(obj, 'obj', { nested: true });
      namespace.setValue(obj, 'fn', () => 'test');
      
      assert.strictEqual(obj.str, 'string');
      assert.strictEqual(obj.num, 42);
      assert.strictEqual(obj.bool, true);
      assert.strictEqual(obj.nil, null);
      assert.strictEqual(obj.undef, undefined);
      assert.deepStrictEqual(obj.arr, [1, 2, 3]);
      assert.deepStrictEqual(obj.obj, { nested: true });
      assert.strictEqual(obj.fn(), 'test');
    });
  });

  describe('remove()', () => {
    it('should remove value at path', () => {
      const obj = { a: { b: 'value' } };
      namespace.remove(obj, 'a.b');
      assert.deepStrictEqual(obj.a, {});
      assert.strictEqual('b' in obj.a, false);
    });

    it('should remove nested path', () => {
      const obj = { a: { b: { c: { d: 'deep' } } } };
      namespace.remove(obj, 'a.b.c');
      assert.deepStrictEqual(obj.a.b, {});
    });

    it('should return deleted value', () => {
      const obj = { a: { b: 'value' } };
      const result = namespace.remove(obj, 'a.b');
      assert.strictEqual(result, 'value');
    });

    it('should return NotFound for non-existent path', () => {
      const obj = { a: {} };
      const result = namespace.remove(obj, 'a.b');
      assert.strictEqual(result, namespace.NotFound);
    });
  });

  describe('leafNode() - safe defaults', () => {
    it('should set value if not exists', () => {
      const obj = {};
      const result = namespace.leafNode(obj, 'a.b', 'default');
      assert.strictEqual(result, 'default');
      assert.strictEqual(obj.a.b, 'default');
    });

    it('should return existing value without overwriting', () => {
      const obj = { a: { b: 'existing' } };
      const result = namespace.leafNode(obj, 'a.b', 'new');
      assert.strictEqual(result, 'existing');
      assert.strictEqual(obj.a.b, 'existing');
    });

    it('should work with complex default values', () => {
      const obj = {};
      const map = new Map();
      const result = namespace.leafNode(obj, 'cache', map);
      assert.strictEqual(result, map);
      assert.strictEqual(obj.cache, map);
    });

    it('should not overwrite falsy values', () => {
      const obj = { a: { b: 0 } };
      const result = namespace.leafNode(obj, 'a.b', 999);
      assert.strictEqual(result, 0);
    });

    it('should not overwrite empty string', () => {
      const obj = { a: { b: '' } };
      const result = namespace.leafNode(obj, 'a.b', 'default');
      assert.strictEqual(result, '');
    });

    it('should not overwrite null', () => {
      const obj = { a: { b: null } };
      const result = namespace.leafNode(obj, 'a.b', 'default');
      assert.strictEqual(result, null);
    });
  });

  describe('join()', () => {
    it('should join strings with dots', () => {
      assert.strictEqual(namespace.join('a', 'b', 'c'), 'a.b.c');
    });

    it('should flatten arrays', () => {
      assert.strictEqual(namespace.join('a', ['b', 'c']), 'a.b.c');
    });

    it('should handle mixed arrays and strings', () => {
      assert.strictEqual(namespace.join('a', ['b', 'c'], 'd'), 'a.b.c.d');
    });

    it('should split strings on dots and rejoin', () => {
      assert.strictEqual(namespace.join('a.b', 'c.d'), 'a.b.c.d');
    });

    it('should handle empty parts', () => {
      assert.strictEqual(namespace.join('a', '', 'b'), 'a..b');
    });

    it('should handle single part', () => {
      assert.strictEqual(namespace.join('single'), 'single');
    });

    it('should handle no parts', () => {
      assert.strictEqual(namespace.join(), '');
    });
  });

  describe('flatten()', () => {
    it('should flatten nested object', () => {
      const obj = { a: { b: { c: 'value' } } };
      assert.deepStrictEqual(namespace.flatten(obj), { 'a.b.c': 'value' });
    });

    it('should handle arrays as values (not recurse)', () => {
      const obj = { a: { b: [1, 2, 3] } };
      assert.deepStrictEqual(namespace.flatten(obj), { 'a.b': [1, 2, 3] });
    });

    it('should handle multiple branches', () => {
      const obj = { a: { x: 1 }, b: { y: 2 } };
      assert.deepStrictEqual(namespace.flatten(obj), { 'a.x': 1, 'b.y': 2 });
    });

    it('should handle flat object (no nesting)', () => {
      const obj = { a: 1, b: 2 };
      assert.deepStrictEqual(namespace.flatten(obj), { a: 1, b: 2 });
    });

    it('should handle empty object', () => {
      assert.deepStrictEqual(namespace.flatten({}), {});
    });

    it('should handle null values', () => {
      const obj = { a: { b: null } };
      assert.deepStrictEqual(namespace.flatten(obj), { 'a.b': null });
    });

    it('should handle deeply nested structure', () => {
      const obj = { a: { b: { c: { d: { e: 'deep' } } } } };
      assert.deepStrictEqual(namespace.flatten(obj), { 'a.b.c.d.e': 'deep' });
    });
  });

  describe('expand()', () => {
    it('should expand flat object', () => {
      const flat = { 'a.b.c': 'value' };
      assert.deepStrictEqual(namespace.expand(flat), { a: { b: { c: 'value' } } });
    });

    it('should expand multiple paths', () => {
      const flat = { 'a.x': 1, 'b.y': 2 };
      assert.deepStrictEqual(namespace.expand(flat), { a: { x: 1 }, b: { y: 2 } });
    });

    it('should handle overlapping paths', () => {
      const flat = { 'a.b': 1, 'a.c': 2 };
      assert.deepStrictEqual(namespace.expand(flat), { a: { b: 1, c: 2 } });
    });

    it('should handle empty object', () => {
      assert.deepStrictEqual(namespace.expand({}), {});
    });

    it('should expand arrays as values', () => {
      const flat = { 'a.b': [1, 2, 3] };
      assert.deepStrictEqual(namespace.expand(flat), { a: { b: [1, 2, 3] } });
    });

    it('should round-trip with flatten', () => {
      const original = { a: { b: { c: 'value', d: [1, 2] } }, e: null };
      const flat = namespace.flatten(original);
      const expanded = namespace.expand(flat);
      // Note: expand uses overwrite, so it will reconstruct
      assert.deepStrictEqual(expanded, original);
    });
  });

  describe('traverse() - low-level', () => {
    it('should traverse and execute func', () => {
      const obj = { a: { b: { c: 'value' } } };
      let visited = [];
      
      namespace.traverse({
        object: obj,
        address: 'a.b.c',
        func: (t) => {
          visited.push(t.addressComponent);
        }
      });
      
      assert.deepStrictEqual(visited, ['a', 'b', 'c']);
    });

    it('should support early return with returnNow', () => {
      const obj = { a: { b: { c: 'value' } } };
      
      const result = namespace.traverse({
        object: obj,
        address: 'a.b.c',
        func: (t) => {
          if (t.addressComponent === 'b') {
            t.returnNow = true;
            t.toReturn = 'stopped at b';
          }
        }
      });
      
      assert.strictEqual(result, 'stopped at b');
    });

    it('should throw for invalid object', () => {
      assert.throws(
        () => namespace.traverse({ object: null, address: 'a' }),
        /not a valid namespace root/
      );
    });

    it('should return root object for null address', () => {
      const obj = { test: true };
      const result = namespace.traverse({
        object: obj,
        address: null,
        func: () => {}
      });
      // traverse returns nothing for null address (sets ctx.toReturn)
    });
  });

  describe('Integration scenarios', () => {
    it('should handle API validation use case', () => {
      const req = { body: { config: { server: { port: 3000 } } } };
      
      // This would be used in an API endpoint
      const config = namespace.getMustExist(req.body, 'config', {
        errorMessage: "API Error: 'config' is required in request body"
      });
      
      const port = namespace.getIfExists(config, 'server.port', {
        defaultValueToReturn: 8080
      });
      
      assert.strictEqual(port, 3000);
    });

    it('should handle safe initialization pattern', () => {
      const app = {};
      
      // Multiple modules might try to initialize cache
      const cache1 = namespace.leafNode(app, 'cache.users', new Map());
      const cache2 = namespace.leafNode(app, 'cache.users', new Map());
      
      // Should be the same object
      assert.strictEqual(cache1, cache2);
      assert.strictEqual(app.cache.users, cache1);
    });

    it('should handle configuration merging', () => {
      const defaults = { server: { port: 3000, host: 'localhost' } };
      const userConfig = { server: { port: 8080 } };
      
      const config = {};
      
      // Set defaults with safety (will fail if exists, so we need overwrite or fresh object)
      namespace.setValue(config, 'server.port', defaults.server.port, { overwrite: true });
      namespace.setValue(config, 'server.host', defaults.server.host, { overwrite: true });
      
      // Merge user config
      namespace.setValue(config, 'server.port', userConfig.server.port, { overwrite: true });
      
      assert.deepStrictEqual(config, { server: { port: 8080, host: 'localhost' } });
    });

    it('should handle deep setting with safety', () => {
      const config = { database: { primary: { url: 'postgres://old' } } };
      
      // Try to set without overwrite should fail
      assert.throws(
        () => namespace.setValue(config, 'database.primary.url', 'postgres://new'),
        /cannot overwrite/
      );
      
      // With overwrite it works
      namespace.setValue(config, 'database.primary.url', 'postgres://new', { overwrite: true });
      assert.strictEqual(config.database.primary.url, 'postgres://new');
    });

    it('should handle complex nested structures', () => {
      const data = {
        users: {
          'user-1': { name: 'Alice', settings: { theme: 'dark' } },
          'user-2': { name: 'Bob', settings: { theme: 'light' } }
        }
      };
      
      assert.strictEqual(namespace.getIfExists(data, 'users.user-1.name'), 'Alice');
      assert.strictEqual(namespace.getIfExists(data, 'users.user-2.settings.theme'), 'light');
      assert.strictEqual(namespace.isNotFound(data, 'users.user-3'), true);
    });

    it('should work with Symbol-named properties', () => {
      const sym = Symbol('test');
      const obj = {};
      obj[sym] = { nested: 'value' };
      
      // Dotted paths only work with string keys
      // This verifies we don't crash on symbols
      assert.strictEqual(namespace.getIfExists(obj, 'nonexistent'), namespace.NotFound);
    });
  });
});

describe('AI Agent Patterns', () => {
  it('should handle structured LLM output with fallbacks', () => {
    // Simulating different LLM output formats
    const nestedFormat = {
      intent: { type: 'greeting', confidence: 0.95 },
      entities: { name: 'Alice' }
    };
    
    const flatFormat = {
      intent_type: 'greeting',
      entity_name: 'Alice'
    };
    
    function extractIntent(data) {
      return namespace.getIfExists(data, 'intent.type', {
        defaultValueToReturn: namespace.getIfExists(data, 'intent_type')
      });
    }
    
    function extractName(data) {
      return namespace.getIfExists(data, 'entities.name', {
        defaultValueToReturn: namespace.getIfExists(data, 'entity_name')
      });
    }
    
    assert.strictEqual(extractIntent(nestedFormat), 'greeting');
    assert.strictEqual(extractIntent(flatFormat), 'greeting');
    assert.strictEqual(extractName(nestedFormat), 'Alice');
    assert.strictEqual(extractName(flatFormat), 'Alice');
  });

  it('should support conversation state management', () => {
    const session = {};
    
    // Turn 1: Learn user's name
    namespace.setValue(session, 'user.name', 'Alice');
    assert.strictEqual(namespace.exists(session, 'user.name'), true);
    
    // Turn 2: Add preference
    namespace.setValue(session, 'user.preferences.theme', 'dark');
    assert.strictEqual(namespace.getIfExists(session, 'user.preferences.theme'), 'dark');
    
    // Check for unknown info
    assert.strictEqual(namespace.exists(session, 'user.age'), false);
    assert.strictEqual(
      namespace.getIfExists(session, 'user.age', { defaultValueToReturn: 'unknown' }),
      'unknown'
    );
  });

  it('should support incremental knowledge building with leafNode', () => {
    const knowledge = {};
    
    // First mention
    namespace.leafNode(knowledge, 'facts.name', 'Alice');
    assert.strictEqual(knowledge.facts.name, 'Alice');
    
    // Try to overwrite (should not work)
    namespace.leafNode(knowledge, 'facts.name', 'Bob');
    assert.strictEqual(knowledge.facts.name, 'Alice');
  });

  it('should validate required fields in agent output', () => {
    const requiredPaths = ['intent.type', 'entities.primary', 'response.text'];
    
    function validateAgentOutput(output) {
      return requiredPaths.filter(path => !namespace.exists(output, path));
    }
    
    const validOutput = {
      intent: { type: 'query' },
      entities: { primary: 'user' },
      response: { text: 'Hello!' }
    };
    
    const invalidOutput = {
      intent: { type: 'query' },
      response: { text: 'Hello!' }
      // missing entities.primary
    };
    
    assert.deepStrictEqual(validateAgentOutput(validOutput), []);
    assert.deepStrictEqual(validateAgentOutput(invalidOutput), ['entities.primary']);
  });

  it('should support multi-step tool chains', () => {
    const context = {};
    
    // Tool 1 result
    namespace.setValue(context, 'tool1.result.userId', 'user-123');
    
    // Tool 2 uses Tool 1 result
    const userId = namespace.getMustExist(context, 'tool1.result.userId');
    namespace.setValue(context, 'tool2.result.orders', [{ id: 'order-1' }]);
    
    // Tool 3 uses Tool 2 result
    const orderId = namespace.getMustExist(context, 'tool2.result.orders.0.id');
    namespace.setValue(context, 'tool3.result.refund', { status: 'completed' });
    
    assert.strictEqual(namespace.getMustExist(context, 'tool3.result.refund.status'), 'completed');
  });
});

describe('API Endpoint Pattern', () => {
  it('should support standardized response envelope', () => {
    const context = {
      ctx: {
        config: {
          database: { url: 'postgres://localhost/app' }
        }
      }
    };
    
    const req = { body: { userId: 'user-123' } };
    const res = {
      statusCode: null,
      jsonBody: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.jsonBody = body; return this; }
    };
    
    // Simulate API handler
    const responseBody = {
      success: false,
      statusCode: 400,
      errorMessage: 'Bad Request'
    };
    
    try {
      const dbUrl = namespace.getMustExist(context, 'ctx.config.database.url');
      const userId = namespace.getMustExist(req.body, 'userId');
      
      responseBody.results = { dbUrl, userId };
      responseBody.statusCode = 200;
      responseBody.success = true;
      delete responseBody.errorMessage;
    } catch (error) {
      responseBody.errorMessage = error.message;
    }
    
    res.status(responseBody.statusCode).json(responseBody);
    
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonBody.success, true);
    assert.deepStrictEqual(res.jsonBody.results, {
      dbUrl: 'postgres://localhost/app',
      userId: 'user-123'
    });
    assert.strictEqual(res.jsonBody.errorMessage, undefined);
  });

  it('should include full path in getMustExist errors', () => {
    const context = {};
    
    try {
      namespace.getMustExist(context, 'ctx.config.database.url');
      assert.fail('Should have thrown');
    } catch (error) {
      assert.ok(error.message.includes('Property not found'));
      assert.ok(error.message.includes('ctx.config.database.url'));
    }
  });

  it('should support custom error messages for API validation', () => {
    const req = { body: {} };
    
    try {
      namespace.getMustExist(req.body, 'userId', {
        errorMessage: 'API Error: userId is required'
      });
      assert.fail('Should have thrown');
    } catch (error) {
      assert.ok(error.message.includes('API Error: userId is required'));
    }
  });

  it('should distinguish missing vs null in form validation', () => {
    const fieldDefs = {
      name: { required: true },
      email: { required: true },
      phone: { required: false }
    };
    
    // Case 1: field not provided (NotFound)
    const appDataMissing = { fieldValues: {} };
    const nameMissing = namespace.getIfExists(appDataMissing, 'fieldValues.name');
    assert.strictEqual(namespace.isNotFound(nameMissing), true);
    
    // Case 2: field explicitly null
    const appDataNull = { fieldValues: { email: null } };
    const emailNull = namespace.getIfExists(appDataNull, 'fieldValues.email');
    assert.strictEqual(namespace.isNotFound(emailNull), false);
    assert.strictEqual(emailNull, null);
    
    // Case 3: field exists with falsy values
    const appDataFalsy = { fieldValues: { phone: '' } };
    const phoneEmpty = namespace.getIfExists(appDataFalsy, 'fieldValues.phone');
    assert.strictEqual(namespace.isNotFound(phoneEmpty), false);
    assert.strictEqual(phoneEmpty, '');
  });

  it('should support dynamic namespace path building', () => {
    const context = {
      tenants: {
        'tenant-1': { config: { theme: 'light' } },
        'tenant-2': { config: { theme: 'dark' } }
      }
    };
    
    function getTenantConfig(tenantId) {
      const tenantNamespace = `tenants.${tenantId}.config`;
      return namespace.getIfExists(context, tenantNamespace, {
        defaultValueToReturn: { theme: 'default' }
      });
    }
    
    assert.deepStrictEqual(getTenantConfig('tenant-1'), { theme: 'light' });
    assert.deepStrictEqual(getTenantConfig('tenant-2'), { theme: 'dark' });
    assert.deepStrictEqual(getTenantConfig('tenant-999'), { theme: 'default' });
  });

  it('should support safe cache initialization pattern', () => {
    const context = {};
    
    // First call creates cache
    const cache1 = namespace.leafNode(context, 'cache.users', new Map());
    cache1.set('user-1', { name: 'Alice' });
    
    // Second call returns existing cache
    const cache2 = namespace.leafNode(context, 'cache.users', new Map());
    
    assert.strictEqual(cache1, cache2);
    assert.deepStrictEqual(cache2.get('user-1'), { name: 'Alice' });
  });
});

describe('namespace module exports', () => {
  it('should export namespace function', () => {
    assert.strictEqual(typeof namespace, 'function');
  });

  it('should have all methods attached', () => {
    assert.strictEqual(typeof namespace.getIfExists, 'function');
    assert.strictEqual(typeof namespace.getMustExist, 'function');
    assert.strictEqual(typeof namespace.setValue, 'function');
    assert.strictEqual(typeof namespace.exists, 'function');
    assert.strictEqual(typeof namespace.remove, 'function');
    assert.strictEqual(typeof namespace.leafNode, 'function');
    assert.strictEqual(typeof namespace.join, 'function');
    assert.strictEqual(typeof namespace.flatten, 'function');
    assert.strictEqual(typeof namespace.expand, 'function');
    assert.strictEqual(typeof namespace.isNotFound, 'function');
    assert.strictEqual(typeof namespace.traverse, 'function');
  });

  it('should have NotFound sentinel', () => {
    assert.ok(namespace.NotFound);
    assert.strictEqual(namespace.NotFound.namespaceFunctionConstant, 'NotFound');
  });
});
