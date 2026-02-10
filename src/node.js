/**
 * namespace-node.js
 * Node.js entry point with enhanced debugging
 */

const namespace = require("./core.js");

// Node.js-specific: use util.inspect for better error messages if available
try {
  const util = require("util");
  
  // Override getMustExist to use util.inspect in default error messages
  const originalGetMustExist = namespace.getMustExist;
  namespace.getMustExist = function(object, address, options) {
    if (options === undefined || options === null) options = {};
    
    const result = namespace.getIfExists(object, address);
    if (result === namespace.NotFound) {
      const objectPreview = util.inspect(object, { depth: 2 }).slice(0, 200);
      const errorMessage = options.errorMessage || 
        `Property not found: "${address}" in object: ${objectPreview}`;
      throw new Error(errorMessage);
    }
    return result;
  };
} catch (e) {
  // util not available, use default behavior
}

module.exports = namespace;
module.exports.default = namespace;
module.exports.NotFound = namespace.NotFound;
