/**
 * AI Agent Example
 * 
 * Shows how AI agents can use namespace to:
 * - Manage conversation state
 * - Handle structured LLM outputs
 * - Build configuration incrementally
 * - Validate required fields
 */

const namespace = require('../dist/namespace.cjs');

// ============================================
// Example 1: Conversation State Management
// ============================================
console.log('=== Example 1: Conversation State ===\n');

const conversation = {};

// Turn 1: User introduces themselves
console.log('Turn 1: User says "My name is Alice"');
namespace.setValue(conversation, 'user.name', 'Alice');
console.log('Conversation state:', JSON.stringify(conversation, null, 2));

// Turn 2: User mentions preferences
console.log('\nTurn 2: User says "I prefer dark mode"');
namespace.setValue(conversation, 'user.preferences.theme', 'dark');
namespace.setValue(conversation, 'user.preferences.language', 'en');
console.log('Conversation state:', JSON.stringify(conversation, null, 2));

// Turn 3: Agent checks what it knows
console.log('\nTurn 3: Agent checks knowledge');
console.log('User name:', namespace.getIfExists(conversation, 'user.name'));
console.log('User age:', namespace.getIfExists(conversation, 'user.age', { 
  defaultValueToReturn: 'unknown' 
}));
console.log('Has theme?', namespace.exists(conversation, 'user.preferences.theme'));

// ============================================
// Example 2: Structured LLM Output
// ============================================
console.log('\n\n=== Example 2: Structured LLM Output ===\n');

// Simulating an LLM response (might have inconsistent structure)
const llmResponses = [
  {
    intent: { type: 'book_flight', confidence: 0.95 },
    entities: {
      destination: 'Paris',
      date: '2024-03-15'
    }
  },
  {
    // Different format - flat structure
    intent_type: 'book_hotel',
    destination: 'Paris'
  }
];

function processLLMOutput(output) {
  const result = {};
  
  // Try nested structure first, fall back to flat
  const intentType = namespace.getIfExists(output, 'intent.type', {
    defaultValueToReturn: namespace.getIfExists(output, 'intent_type')
  });
  
  const destination = namespace.getIfExists(output, 'entities.destination', {
    defaultValueToReturn: namespace.getIfExists(output, 'destination')
  });
  
  const date = namespace.getIfExists(output, 'entities.date', {
    defaultValueToReturn: 'not specified'
  });
  
  // Build normalized structure
  if (!namespace.isNotFound(intentType)) {
    namespace.setValue(result, 'parsed.intent', intentType);
  }
  if (!namespace.isNotFound(destination)) {
    namespace.setValue(result, 'parsed.destination', destination);
  }
  namespace.setValue(result, 'parsed.date', date);
  
  return result;
}

llmResponses.forEach((response, i) => {
  console.log(`LLM Response ${i + 1}:`, JSON.stringify(response, null, 2));
  const processed = processLLMOutput(response);
  console.log('Processed:', JSON.stringify(processed, null, 2));
  console.log();
});

// ============================================
// Example 3: Safe Configuration Building
// ============================================
console.log('=== Example 3: Safe Configuration Building ===\n');

const config = {};

// Step 1: Set defaults (using leafNode so they won't be overwritten)
namespace.leafNode(config, 'database.host', 'localhost');
namespace.leafNode(config, 'database.port', 5432);
namespace.leafNode(config, 'database.ssl', false);

console.log('Default config:', JSON.stringify(config, null, 2));

// Step 2: User provides overrides
console.log('\nUser provides custom port...');
namespace.setValue(config, 'database.port', 3306, { overwrite: true });

console.log('Updated config:', JSON.stringify(config, null, 2));

// Step 3: Try to override again (leafNode won't do it)
console.log('\nTrying to change host with leafNode (will keep existing)...');
namespace.leafNode(config, 'database.host', 'remote.server.com');
console.log('Config after leafNode:', JSON.stringify(config, null, 2));

// ============================================
// Example 4: Validation
// ============================================
console.log('\n\n=== Example 4: Validation ===\n');

function validateBookingRequest(data) {
  const requiredFields = [
    'destination',
    'checkInDate',
    'guests.count'
  ];
  
  const errors = [];
  
  for (const field of requiredFields) {
    if (!namespace.exists(data, field)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return errors;
}

// Valid request
const validRequest = {
  destination: 'Paris',
  checkInDate: '2024-06-01',
  guests: { count: 2 }
};

// Invalid request (missing guests.count)
const invalidRequest = {
  destination: 'London',
  checkInDate: '2024-07-15'
};

console.log('Validating valid request:', validateBookingRequest(validRequest));
console.log('Validating invalid request:', validateBookingRequest(invalidRequest));

// ============================================
// Example 5: Multi-turn Tool Chain
// ============================================
console.log('\n\n=== Example 5: Multi-turn Tool Chain ===\n');

const agentContext = {};

// Tool 1: Search for user
console.log('Tool 1: Search for user');
namespace.setValue(agentContext, 'tools.searchUser.result', {
  id: 'user-123',
  name: 'Alice',
  email: 'alice@example.com'
});

// Tool 2: Get orders (uses result from Tool 1)
console.log('Tool 2: Get orders for user');
const userId = namespace.getMustExist(agentContext, 'tools.searchUser.result.id');
namespace.setValue(agentContext, 'tools.getOrders.result', [
  { id: 'order-1', total: 100 },
  { id: 'order-2', total: 250 }
]);

// Tool 3: Process refund (uses result from Tool 2)
console.log('Tool 3: Process refund for first order');
const firstOrderId = namespace.getMustExist(agentContext, 'tools.getOrders.result.0.id');
namespace.setValue(agentContext, 'tools.processRefund.result', {
  refundId: 'ref-456',
  amount: 100,
  status: 'completed'
});

console.log('Final context:', JSON.stringify(agentContext, null, 2));

console.log('\n=== All Examples Complete ===');

// Export for testing
module.exports = {
  processLLMOutput,
  validateBookingRequest
};
