/**
 * namespace-core.js
 * Universal namespace utilities for JavaScript
 * Works in Node.js and browsers
 */

// NotFound sentinel — frozen object for "not found" semantics
const NotFound = Object.freeze({ namespaceFunctionConstant: "NotFound" });

// Utility functions
function isObject(item) {
  return item !== null && typeof item === "object";
}

function isObjectNotArray(item) {
  return isObject(item) && !Array.isArray(item);
}

function isString(item) {
  return typeof item === "string";
}

function isFunction(item) {
  return typeof item === "function";
}

// Core namespace function — get or create with auto-vivification
function namespace(object, address, defaultList, checkExists) {
  if (object === undefined || object === null || !isObject(object)) {
    throw new Error("namespace: object is not a valid namespace root");
  }

  if (address === null) return object;
  if (address === undefined || !isString(address)) {
    throw new Error("namespace: address is not a valid string: " + address);
  }

  if (checkExists == null) checkExists = false;

  let current = object;
  let last = null;
  const addressList = address.split(".");
  const addressListTestIndex = addressList.length - 1;
  let addressCounter = 0;

  // Default: fill with empty objects
  if (defaultList == null) defaultList = ["{}"];
  const defaultListTestIndex = defaultList.length - 1;
  let defaultCounter = 0;

  // Handle nonLeafNodes and leafNode prefixes
  let nonLeafNodes;
  let leafObject;
  if (defaultList[0].startsWith("nonLeafNodes:")) {
    nonLeafNodes = defaultList[0].replace(/nonLeafNodes:/, "");
  } else if (defaultList[0].startsWith("leafNode:")) {
    defaultList[0] = defaultList[0].replace(/leafNode:/, "");
    if (defaultList[0].length === 0) {
      defaultList[0] = "null";
      leafObject = checkExists;
      checkExists = false;
    }
    nonLeafNodes = "{}";
  }

  let wayPoint;
  for (wayPoint of addressList) {
    if (!current.hasOwnProperty(wayPoint)) {
      if (checkExists !== false) return NotFound;

      let toReturn;
      let toEval;
      if (addressCounter < addressListTestIndex && nonLeafNodes != null) {
        toEval = nonLeafNodes;
      } else {
        toEval = defaultList[defaultCounter];
      }

      // Safe evaluation for object creation
      if (toEval === "{}") {
        toReturn = {};
      } else if (toEval === "[]") {
        toReturn = [];
      } else if (toEval === "new Map()") {
        toReturn = new Map();
      } else if (toEval === "new Set()") {
        toReturn = new Set();
      } else if (toEval === "null") {
        toReturn = null;
      } else {
        // Fallback: try to evaluate safely
        try {
          toReturn = eval("(" + toEval + ")");
        } catch (e) {
          toReturn = {};
        }
      }

      current[wayPoint] = toReturn;
    }
    last = current;
    current = current[wayPoint];
    addressCounter++;
    if (defaultCounter < defaultListTestIndex) {
      defaultCounter++;
    }
  }

  if (leafObject != null && current == null) {
    current = last[wayPoint] = leafObject;
  }

  if (checkExists === "delete") delete last[wayPoint];
  return current;
}

namespace.NotFound = NotFound;

namespace.isNotFound = function(value, address) {
  if (address !== undefined) {
    value = namespace.getIfExists(value, address);
  }
  return isObjectNotArray(value) && value.namespaceFunctionConstant === "NotFound";
};

// TraversalContext-based traversal
namespace.traverse = function(ctx) {
  const { object, address } = ctx;

  if (object === undefined || object === null || !isObject(object)) {
    throw new Error("namespace.traverse: object is not a valid namespace root");
  }

  if (address === null) {
    ctx.toReturn = object;
    return;
  }
  if (address === undefined || (!isString(address) && isNaN(address))) {
    throw new Error("namespace.traverse: address is not valid: " + address);
  }

  const addr = isNaN(address) ? address : address.toString();

  if (ctx.debugging === true) {
    debugger;
  }

  ctx.addressList = addr.split(".");
  ctx.returnNow = false;
  delete ctx.toReturn;
  ctx.current = ctx.object;
  ctx.addressListLength = ctx.addressList.length;
  ctx.index = -1;

  for (ctx.addressComponent of ctx.addressList) {
    ctx.index++;
    try {
      ctx.keyExists = ctx.addressComponent in ctx.current;
      ctx.next = ctx.current[ctx.addressComponent];
    } catch (error) {
      ctx.keyExists = false;
      ctx.next = undefined;
    }
    ctx.finalAddressComponent = ctx.index >= ctx.addressListLength - 1;
    
    if (isFunction(ctx.func)) {
      ctx.func(ctx);
    }
    
    if (ctx.returnNow === true) return ctx.toReturn;
    ctx.current = ctx.next;
  }

  // Loop completed without returning - this is OK for traversal without return value
};

namespace.getIfExists = function(object, address, options) {
  if (options === undefined || options === null) options = {};

  const ctx = {
    object,
    address,
    debugging: options.debugging,
    defaultValueToReturn: options.defaultValueToReturn,
    func: (t) => {
      if (!t.keyExists || t.next === NotFound) {
        t.returnNow = true;
        t.toReturn = t.defaultValueToReturn !== undefined ? t.defaultValueToReturn : NotFound;
      } else if (t.finalAddressComponent === true) {
        t.returnNow = true;
        t.toReturn = t.next;
      }
    }
  };

  namespace.traverse(ctx);
  return ctx.toReturn;
};

namespace.getMustExist = function(object, address, options) {
  if (options === undefined || options === null) options = {};

  const result = namespace.getIfExists(object, address);
  if (result === NotFound) {
    const errorMessage = options.errorMessage || `Property not found: "${address}"`;
    throw new Error(errorMessage);
  }
  return result;
};

namespace.exists = function(object, address) {
  return !namespace.isNotFound(namespace.getIfExists(object, address));
};

namespace.setValue = function(object, address, value, options) {
  if (options === undefined || options === null) options = {};

  if (address === null) {
    throw new Error("namespace.setValue: address cannot be null");
  }

  const ctx = Object.assign(options, {
    object,
    address,
    setValue: value,
    overwrite: options.overwrite === true,
    dryRun: options.dryRun === true,
    ignoreErrors: options.ignoreErrors === true,
    debugging: options.debugging,
    hardWriteHierarchy: options.hardWriteHierarchy === true,
    func: (t) => {
      if (t.debugging === true) debugger;

      if (!t.finalAddressComponent) {
        // Intermediate path component
        if (t.next === undefined) {
          if (t.dryRun === true) {
            t.returnNow = true;
          } else {
            t.next = t.current[t.addressComponent] = {};
          }
        } else if (!isObject(t.next)) {
          if (t.ignoreErrors === true) {
            t.returnNow = true;
            t.toReturn = undefined;
          } else if (t.hardWriteHierarchy === true) {
            t.next = t.current[t.addressComponent] = {};
          } else {
            throw new Error(`namespace.setValue: no valid object hierarchy to "${t.address}"`);
          }
        }
      } else {
        // Final path component
        if (t.overwrite !== true && t.ignoreErrors !== true && t.next !== undefined) {
          throw new Error(`namespace.setValue: cannot overwrite existing value at "${t.address}"`);
        } else if (t.dryRun || (t.overwrite === false && t.ignoreErrors === true && t.next !== undefined)) {
          t.returnNow = true;
        } else {
          t.current[t.addressComponent] = t.setValue;
          t.returnNow = true;
          t.toReturn = t.setValue;
        }
      }
    }
  });

  return namespace.traverse(ctx);
};

namespace.remove = function(object, address) {
  return namespace(object, address, null, "delete");
};

namespace.leafNode = function(object, address, leafValue) {
  const ctx = { overwrite: false };
  try {
    return namespace.setValue(object, address, leafValue, ctx);
  } catch (error) {
    if (error.message && error.message.includes("cannot overwrite existing value")) {
      return ctx.next;
    }
    throw error;
  }
};

namespace.join = function(...parts) {
  const fullAddressList = [];
  for (const item of parts) {
    if (Array.isArray(item)) {
      fullAddressList.push(...item);
    } else if (isString(item)) {
      fullAddressList.push(...item.split("."));
    }
  }
  return fullAddressList.join(".");
};

namespace.flatten = function(objectToFlatten, currentNamespace, toReturn) {
  if (toReturn === undefined) toReturn = {};

  if (isObjectNotArray(objectToFlatten)) {
    for (const [namespaceItem, recurseIntoThisObject] of Object.entries(objectToFlatten)) {
      const targetNamespace = currentNamespace === undefined 
        ? namespaceItem 
        : currentNamespace + "." + namespaceItem;
      namespace.flatten(recurseIntoThisObject, targetNamespace, toReturn);
    }
  } else {
    if (currentNamespace !== undefined) {
      toReturn[currentNamespace] = objectToFlatten;
    }
  }
  return toReturn;
};

namespace.expand = function(flatObject) {
  const result = {};
  for (const [path, value] of Object.entries(flatObject)) {
    namespace.setValue(result, path, value, { overwrite: true });
  }
  return result;
};

// Export for both CommonJS and ESM
namespace.NotFound = NotFound;

if (typeof module !== "undefined" && module.exports) {
  module.exports = namespace;
}

export default namespace;
