"use strict";

const namespace = require("../../src/core.js");

// namespace.path and namespace.batch are now part of src/core.js.

// Scope bridge (eval group) — generates a string that, when eval'd in the
// caller's scope, binds tree values to local variables.
// PENDING RENAME (see METALAND/namespace-applied-philosophy.md §8 — scope bridge group)
// This CANNOT be an ordinary function — it must be eval'd in the caller's scope.
namespace.toEval_bindMustExist = function(objectVarName_namespace, bindingDefinition) {
  return Object.entries(bindingDefinition)
    .map(([localVarName, sourcePath_namespace]) =>
      `var ${localVarName} = namespace.getMustExist(${objectVarName_namespace}, "${sourcePath_namespace}");`)
    .join("\n");
};

module.exports = namespace;
