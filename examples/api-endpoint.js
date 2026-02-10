/**
 * API Endpoint Pattern Example
 * 
 * Demonstrates using namespace for:
 * - Safe configuration retrieval with rich error context
 * - Standardized API response envelopes
 * - Self-documenting error paths
 */

const namespace = require('../dist/namespace.cjs');

// Mock Express-like request/response objects
function createMockReqRes() {
  const req = {
    body: {},
    params: {},
    headers: {}
  };
  
  const res = {
    statusCode: 200,
    jsonBody: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.jsonBody = body;
      return this;
    }
  };
  
  return { req, res };
}

/**
 * Example: API endpoint with namespace-driven data access
 * 
 * This pattern demonstrates:
 * 1. Fail-fast validation with full path context in errors
 * 2. Optional fields with defaults using getIfExists
 * 3. Consistent response envelope { success, statusCode, errorMessage, results }
 * 4. Self-documenting error paths via namespace dotted notation
 */
function handleGetApplication(req, res, context) {
  // Standard response envelope
  const responseBody = {
    success: false,
    statusCode: 400,
    errorMessage: 'Bad Request'
  };
  
  try {
    // Retrieve required configuration with rich error context
    // If this fails, error will include full path: "traveller.projects.app.config.database"
    const dbConfig = namespace.getMustExist(
      context,
      'traveller.projects.app.config.database',
      { errorMessage: 'API Error: Database configuration missing' }
    );
    
    // Validate required request fields
    const applicationId = namespace.getMustExist(
      req.body,
      'applicationId',
      { errorMessage: 'API Error: applicationId is required' }
    );
    
    // Optional field with default value
    const includeHistory = namespace.getIfExists(
      req.body,
      'options.includeHistory',
      { defaultValueToReturn: false }
    );
    
    // Safe initialization pattern
    const cache = namespace.leafNode(
      context,
      'cache.applications',
      new Map()
    );
    
    // Check cache first
    let applicationData = cache.get(applicationId);
    
    if (namespace.isNotFound(applicationData)) {
      // Simulate database fetch
      applicationData = {
        id: applicationId,
        status: 'pending',
        submittedAt: Date.now()
      };
      cache.set(applicationId, applicationData);
    }
    
    // Build success response
    responseBody.results = {
      application: applicationData,
      includeHistory: includeHistory
    };
    
    responseBody.statusCode = 200;
    responseBody.success = true;
    delete responseBody.errorMessage;
    
  } catch (error) {
    // Error message includes full namespace path from getMustExist
    responseBody.errorMessage = error.message;
    
    // Handle specific authorization errors
    if (error.message.includes('Not Authorised')) {
      responseBody.statusCode = 403;
    }
  }
  
  // Consistent JSON response
  return res.status(responseBody.statusCode).json(responseBody);
}

/**
 * Example: Form validation with namespace
 * 
 * Demonstrates distinguishing between "field not sent" vs "field is null"
 */
function validateApplicationFields(applicationData, fieldDefinitions) {
  const errors = [];
  
  for (const [fieldName, fieldDef] of Object.entries(fieldDefinitions)) {
    // Dynamic path construction
    const fieldPath = `fieldValues.${fieldName}`;
    const fieldValue = namespace.getIfExists(applicationData, fieldPath);
    
    // Distinguish: not sent (NotFound) vs explicitly null
    if (namespace.isNotFound(fieldValue)) {
      if (fieldDef.required) {
        errors.push(`Field '${fieldName}' is required but was not provided`);
      }
    } else if (fieldValue === null) {
      if (fieldDef.required && !fieldDef.allowNull) {
        errors.push(`Field '${fieldName}' cannot be null`);
      }
    }
    // Field exists (even if empty string, 0, false)
  }
  
  return errors;
}

/**
 * Example: Multi-tenant configuration access
 * 
 * Demonstrates dynamic namespace path building
 */
function getTenantConfig(context, tenantId) {
  const tenantNamespace = `traveller.tenants.${tenantId}.config`;
  
  // This will throw with full path if tenant doesn't exist
  return namespace.getMustExist(
    context,
    tenantNamespace,
    { errorMessage: `Tenant '${tenantId}' not found or not configured` }
  );
}

// Demo usage
if (require.main === module) {
  console.log('=== API Endpoint Pattern Demo ===\n');
  
  // Setup mock context with nested config
  const context = {
    traveller: {
      projects: {
        app: {
          config: {
            database: { url: 'postgres://localhost/app' }
          }
        }
      },
      tenants: {
        'tenant-1': {
          config: { theme: 'light', features: ['a', 'b'] }
        }
      }
    }
  };
  
  // Demo 1: Successful request
  console.log('1. Successful request:');
  const { req: req1, res: res1 } = createMockReqRes();
  req1.body = { applicationId: 'app-123', options: { includeHistory: true } };
  
  handleGetApplication(req1, res1, context);
  console.log('Status:', res1.statusCode);
  console.log('Response:', JSON.stringify(res1.jsonBody, null, 2));
  console.log();
  
  // Demo 2: Missing required field
  console.log('2. Missing required field:');
  const { req: req2, res: res2 } = createMockReqRes();
  req2.body = {}; // No applicationId
  
  handleGetApplication(req2, res2, context);
  console.log('Status:', res2.statusCode);
  console.log('Error:', res2.jsonBody.errorMessage);
  console.log();
  
  // Demo 3: Form validation
  console.log('3. Form validation:');
  const fieldDefs = {
    name: { required: true },
    email: { required: true },
    phone: { required: false }
  };
  
  const appData = {
    fieldValues: {
      name: 'John',
      email: null  // Explicitly null
      // phone not provided — will be NotFound
    }
  };
  
  const validationErrors = validateApplicationFields(appData, fieldDefs);
  console.log('Validation errors:', validationErrors);
  console.log();
  
  // Demo 4: Multi-tenant config
  console.log('4. Multi-tenant config access:');
  const tenantConfig = getTenantConfig(context, 'tenant-1');
  console.log('Tenant config:', tenantConfig);
  console.log();
  
  // Demo 5: Missing tenant (will throw)
  console.log('5. Missing tenant (error handling):');
  try {
    getTenantConfig(context, 'tenant-999');
  } catch (error) {
    console.log('Error:', error.message);
  }
}

module.exports = {
  handleGetApplication,
  validateApplicationFields,
  getTenantConfig
};
