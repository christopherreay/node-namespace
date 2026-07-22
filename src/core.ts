// NotFound sentinel — frozen; returned by get() when a path is absent
export const NotFound: Readonly<{ namespaceFunctionConstant: "NotFound" }> = Object.freeze({ namespaceFunctionConstant: "NotFound" });

// ── global config ─────────────────────────────────────────────────────────────

const globalConfig = { errorContext: false };

export function configure(options: { errorContext?: boolean }): void {
  if (options && options.errorContext !== undefined) {
    globalConfig.errorContext = options.errorContext;
  }
}

function buildErrorMessage(message: string, rootObject: any): string {
  if (!globalConfig.errorContext) return message;
  try {
    const json_value      = JSON.stringify(rootObject);
    const truncated_value = json_value.length > 200 ? json_value.slice(0, 200) + "…" : json_value;
    return message + "\n  object: " + truncated_value;
  } catch (_ignored) {
    return message + "\n  object: [unstringifiable]";
  }
}

// ── internal helpers ──────────────────────────────────────────────────────────

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

// traverse(traversalContext) — walk a dotted path, calling traversalContext.func
// at every segment.
//
// traversalContext must supply:
//   .object   — the root object to traverse
//   .address  — dotted path string, or null to return root
//   .func(pathStep) — called at each segment; pathStep IS traversalContext
//
// pathStep (same object, named for its role inside func) exposes:
//   .current               — the object at the current depth
//   .next                  — value at this segment (undefined if absent)
//   .keyExists             — hasOwnProperty result for this segment
//   .addressComponent      — the segment string ("users", "alice", …)
//   .finalAddressComponent — true when this is the last segment
//   .index                 — zero-based segment index
//   .addressListLength     — total segment count
//
// func may write:
//   .returnNow = true   — stop traversal
//   .toReturn  = value  — value to return from traverse()
//
// traverse() returns traversalContext.toReturn when returnNow is set.
export function traverse(traversalContext: any): any {
  const rootObject    = traversalContext.object;
  const dottedAddress = traversalContext.address;

  if (rootObject === undefined || rootObject === null || !isObject(rootObject)) {
    throw new Error(buildErrorMessage("namespace: object is not a valid root", rootObject));
  }

  if (dottedAddress === null) {
    traversalContext.toReturn = rootObject;
    return;
  }

  if (!isString(dottedAddress)) {
    throw new Error(buildErrorMessage("namespace: address must be a string: " + dottedAddress, rootObject));
  }

  const addressSegments               = dottedAddress.split(".");
  traversalContext.addressList        = addressSegments;
  traversalContext.addressListLength  = addressSegments.length;
  traversalContext.returnNow          = false;
  delete traversalContext.toReturn;
  traversalContext.current = rootObject;

  for (let segmentIndex = 0; segmentIndex < addressSegments.length; segmentIndex++) {
    traversalContext.index                 = segmentIndex;
    traversalContext.addressComponent      = addressSegments[segmentIndex];
    traversalContext.finalAddressComponent = (segmentIndex >= addressSegments.length - 1);

    try {
      traversalContext.keyExists = Object.prototype.hasOwnProperty.call(
        traversalContext.current, traversalContext.addressComponent
      );
      traversalContext.next = traversalContext.current[traversalContext.addressComponent];
    } catch (_ignored) {
      traversalContext.keyExists = false;
      traversalContext.next      = undefined;
    }

    // pathStep and traversalContext are the same object;
    // "pathStep" names its role as seen from inside func
    traversalContext.func(traversalContext);

    if (traversalContext.returnNow === true) return traversalContext.toReturn;
    traversalContext.current = traversalContext.next;
  }
}

// ── read verbs ────────────────────────────────────────────────────────────────

// getIfExists(object, path)
// Returns the value at path, or the NotFound sentinel if any segment is absent.
// Never writes.
export function getIfExists(object: any, path: string): any {
  const traversalContext = {
    object,
    address: path,
    func(pathStep: any) {
      if (!pathStep.keyExists) {
        pathStep.returnNow = true;
        pathStep.toReturn  = NotFound;
      } else if (pathStep.finalAddressComponent) {
        pathStep.returnNow = true;
        pathStep.toReturn  = pathStep.next;
      }
      // else: key present, not final — continue traversal
    }
  };
  traverse(traversalContext);
  return traversalContext.toReturn;
}

// getMustExist(object, path, opts?)
// Returns the value, or throws (opts.errorMessage if given).
// Never writes.
export function getMustExist(object: any, path: string, options?: { errorMessage?: string }): any {
  const foundValue_probed = getIfExists(object, path);
  if (foundValue_probed === NotFound) {
    const baseMessage =
      (options && options.errorMessage) ||
      `namespace.getMustExist: property not found at "${path}"`;
    throw new Error(buildErrorMessage(baseMessage, object));
  }
  return foundValue_probed;
}

// getMustEmpty(object, path)
// Throws if a value is present at path.  Returns nothing useful.
// Use as a guard on its own line before writing to a slot you know is new.
export function getMustEmpty(object: any, path: string): void {
  const foundValue_probed = getIfExists(object, path);
  if (foundValue_probed !== NotFound) {
    throw new Error(buildErrorMessage(
      `namespace.getMustEmpty: path must be empty but value found at "${path}"`,
      object
    ));
  }
}

// getOrDefault(object, path, standIn)
// Returns the stored value, or standIn if absent.  standIn is a required
// positional argument — if you want the sentinel, use get().  Never writes.
export function getOrDefault(object: any, path: string, standIn: any): any {
  const foundValue_probed = getIfExists(object, path);
  return foundValue_probed === NotFound ? standIn : foundValue_probed;
}

// getOrDefault.syncFunc(object, path, fn)
// Like getOrDefault, but calls fn() only when absent.  Never writes.
getOrDefault.syncFunc = function syncFunc(object: any, path: string, fn: () => any): any {
  const foundValue_probed = getIfExists(object, path);
  if (foundValue_probed !== NotFound) return foundValue_probed;
  return fn();
};

// getOrDefault.asyncFunc(object, path, fn)
// Like getOrDefault, but calls async fn() only when absent.  Never writes.
// Always returns a promise.
getOrDefault.asyncFunc = async function asyncFunc(object: any, path: string, fn: () => Promise<any>): Promise<any> {
  const foundValue_probed = getIfExists(object, path);
  if (foundValue_probed !== NotFound) return foundValue_probed;
  return await fn();
};

// ── write verbs ───────────────────────────────────────────────────────────────

// setNotExists(object, path, value)
// Create-only: writes value, throws if path already holds something.
// Auto-vivifies missing intermediate objects.
export function setNotExists(object: any, path: string, valueToSet: any): any {
  if (path === null) throw new Error("namespace.setNotExists: path cannot be null");

  const traversalContext = {
    object,
    address:    path,
    valueToSet,
    func(pathStep: any) {
      if (!pathStep.finalAddressComponent) {
        if (!pathStep.keyExists) {
          pathStep.next = pathStep.current[pathStep.addressComponent] = {};
        } else if (!isObject(pathStep.next)) {
          throw new Error(buildErrorMessage(
            `namespace.setNotExists: cannot traverse through non-object at "${pathStep.addressComponent}" on path "${path}"`,
            object
          ));
        }
      } else {
        if (pathStep.keyExists) {
          throw new Error(buildErrorMessage(
            `namespace.set: cannot overwrite existing value at "${path}"`,
            object
          ));
        }
        pathStep.current[pathStep.addressComponent] = pathStep.valueToSet;
        pathStep.returnNow = true;
        pathStep.toReturn  = pathStep.valueToSet;
      }
    }
  };
  traverse(traversalContext);
  return traversalContext.toReturn;
}

// setMustExist(object, path, value)
// Update-only: writes value, throws if path is absent.
// Does NOT auto-vivify — the whole hierarchy must already exist.
export function setMustExist(object: any, path: string, valueToSet: any): any {
  if (path === null) throw new Error("namespace.setMustExist: path cannot be null");

  const traversalContext = {
    object,
    address:    path,
    valueToSet,
    func(pathStep: any) {
      if (!pathStep.finalAddressComponent) {
        if (!pathStep.keyExists || !isObject(pathStep.next)) {
          throw new Error(buildErrorMessage(
            `namespace.setMustExist: path does not exist: "${path}"`,
            object
          ));
        }
      } else {
        if (!pathStep.keyExists) {
          throw new Error(buildErrorMessage(
            `namespace.setMustExist: path must exist but is absent: "${path}"`,
            object
          ));
        }
        pathStep.current[pathStep.addressComponent] = pathStep.valueToSet;
        pathStep.returnNow = true;
        pathStep.toReturn  = pathStep.valueToSet;
      }
    }
  };
  traverse(traversalContext);
  return traversalContext.toReturn;
}

// setOrDefault(object, path, value)
// Convergence: writes value only if path is absent; returns whichever now holds.
// Auto-vivifies missing intermediate objects.
// "Many routes converge here; set it if no route has, else keep."
export function setOrDefault(object: any, path: string, valueToSet: any): any {
  if (path === null) throw new Error("namespace.setOrDefault: path cannot be null");

  const traversalContext = {
    object,
    address:    path,
    valueToSet,
    func(pathStep: any) {
      if (!pathStep.finalAddressComponent) {
        if (!pathStep.keyExists) {
          pathStep.next = pathStep.current[pathStep.addressComponent] = {};
        } else if (!isObject(pathStep.next)) {
          throw new Error(buildErrorMessage(
            `namespace.setOrDefault: cannot traverse through non-object at "${pathStep.addressComponent}" on path "${path}"`,
            object
          ));
        }
      } else {
        if (pathStep.keyExists) {
          pathStep.returnNow = true;
          pathStep.toReturn  = pathStep.next;
        } else {
          pathStep.current[pathStep.addressComponent] = pathStep.valueToSet;
          pathStep.returnNow = true;
          pathStep.toReturn  = pathStep.valueToSet;
        }
      }
    }
  };
  traverse(traversalContext);
  return traversalContext.toReturn;
}

// setOrDefault.syncFunc(object, path, fn)
// Like setOrDefault, but calls fn() only when absent.  Writes the result.
setOrDefault.syncFunc = function syncFunc(object: any, path: string, fn: () => any): any {
  const foundValue_probed = getIfExists(object, path);
  if (foundValue_probed !== NotFound) return foundValue_probed;
  return setOrDefault(object, path, fn());
};

// setOrDefault.asyncFunc(object, path, fn)
// Like setOrDefault, but calls async fn() only when absent.
// Awaits the result, writes it, returns a promise.
setOrDefault.asyncFunc = async function asyncFunc(object: any, path: string, fn: () => Promise<any>): Promise<any> {
  const foundValue_probed = getIfExists(object, path);
  if (foundValue_probed !== NotFound) return foundValue_probed;
  const resolved = await fn();
  return setOrDefault(object, path, resolved);
};

// setOverwrite(object, path, value)
// Writes unconditionally, clobbering any existing value.
// Auto-vivifies missing intermediate objects.
// The long name is the signal: you mean to clobber.
export function setOverwrite(object: any, path: string, valueToSet: any, options?: { overwriteStructure?: boolean }): any {
  if (path === null) throw new Error("namespace.setOverwrite: path cannot be null");

  const traversalContext = {
    object,
    address:    path,
    valueToSet,
    func(pathStep: any) {
      if (!pathStep.finalAddressComponent) {
        if (!pathStep.keyExists) {
          pathStep.next = pathStep.current[pathStep.addressComponent] = {};
        } else if (!isObject(pathStep.next)) {
          if (options && options.overwriteStructure) {
            pathStep.next = pathStep.current[pathStep.addressComponent] = {};
          } else {
            throw new Error(buildErrorMessage(
              `namespace.setOverwrite: cannot traverse through non-object at "${pathStep.addressComponent}" on path "${path}" — use { overwriteStructure: true } to clobber structure`,
              object
            ));
          }
        }
      } else {
        pathStep.current[pathStep.addressComponent] = pathStep.valueToSet;
        pathStep.returnNow = true;
        pathStep.toReturn  = pathStep.valueToSet;
      }
    }
  };
  traverse(traversalContext);
  return traversalContext.toReturn;
}

// ── test verbs ────────────────────────────────────────────────────────────────

// exists(object, path)
// Returns true iff the path holds something — including 0, false, "", null.
export function exists(object: any, path: string): boolean {
  return getIfExists(object, path) !== NotFound;
}

// isNotFound(value)
// Returns true iff value is the NotFound sentinel returned by get().
export function isNotFound(value: unknown): boolean {
  return (
    isObject(value) &&
    !Array.isArray(value) &&
    (value as any).namespaceFunctionConstant === "NotFound"
  );
}

// ── namespace.path ────────────────────────────────────────────────────────────
//
// Pure path-string algebra — no tree argument.
// Every function here takes strings (or arrays of strings) and returns strings.

export const path: {
  join(...parts: (string | string[])[]): string;
  joinSlash(...parts: (string | string[])[]): string;
  split(dottedPath: string): string[];
  isRootOf(rootPath: string, targetPath: string): boolean;
  tween(dottedPath: string, tweenSegment?: string): string | undefined;
} = {

  // join("users", userId, "entries")  →  "users.alice.entries"
  // join("a.b", ["c", "d"])           →  "a.b.c.d"
  // Each part is split on "." before joining, so partial paths compose cleanly.
  join(...parts: (string | string[])[]): string {
    const segments_list: string[] = [];
    for (const part of parts) {
      if (Array.isArray(part))  segments_list.push(...part);
      else if (isString(part))  segments_list.push(...part.split("."));
    }
    return segments_list.join(".");
  },

  // Same as join but uses "/" — for URL-style paths.
  joinSlash(...parts: (string | string[])[]): string {
    const segments_list: string[] = [];
    for (const part of parts) {
      if (Array.isArray(part))  segments_list.push(...part);
      else if (isString(part))  segments_list.push(...part.split("/"));
    }
    return segments_list.join("/");
  },

  // split("a.b.c")  →  ["a", "b", "c"]
  split(dottedPath_namespace: string): string[] {
    if (!isString(dottedPath_namespace)) {
      throw new Error("namespace.path.split: path must be a string");
    }
    return dottedPath_namespace.split(".");
  },

  // isRootOf("users.alice", "users.alice.entries")  →  true
  // isRootOf("users.alice", "users.alice")           →  true  (exact match)
  // isRootOf("users.alice", "users.alicex")          →  false (not a segment boundary)
  isRootOf(rootPath_namespace: string, targetPath_namespace: string): boolean {
    if (!isString(rootPath_namespace) || !isString(targetPath_namespace)) return false;
    if (rootPath_namespace === targetPath_namespace) return true;
    return targetPath_namespace.startsWith(rootPath_namespace + ".");
  },

  // tween("a.b.c")           →  "a.children.b.children.c"
  // tween("a.b.c", "items")  →  "a.items.b.items.c"
  // Single-segment paths pass through unchanged.
  tween(dottedPath_namespace: string, tweenSegment?: string): string | undefined {
    if (!isString(dottedPath_namespace)) return undefined;
    const separator_value = isString(tweenSegment) ? tweenSegment : "children";
    return dottedPath_namespace.split(".").join("." + separator_value + ".");
  },

};

// ── namespace.batch ───────────────────────────────────────────────────────────
//
// Operations that apply a point contract across multiple paths in one call.
// Names are PENDING RENAME — implementations are settled, grammar is not.

export const batch: {
  destructureMustExist(object: any, mappingDefinition: Record<string, string>, options?: { errorMessage?: string }): Record<string, any>;
  allMustExist(object: any, pathList: string[], options?: { errorMessage?: string }): Record<string, any>;
  extractMustExist(object: any, path: string): any;
} = {

  // PENDING RENAME
  // destructureMustExist(obj, { localKey: "source.path" })
  // Returns { localKey: value } for each entry — throws if any path is absent.
  // The mapping object IS the preamble contract: every dependency declared once.
  destructureMustExist(object: any, mappingDefinition: Record<string, string>, options?: { errorMessage?: string }): Record<string, any> {
    const result_node: Record<string, any> = {};
    for (const [localKey, sourcePath_namespace] of Object.entries(mappingDefinition)) {
      result_node[localKey] = getMustExist(object, sourcePath_namespace, options);
    }
    return result_node;
  },

  // PENDING RENAME
  // allMustExist(obj, ["a.b", "c.d"])
  // Returns { "a.b": value1, "c.d": value2 } — throws if any path is absent.
  // Keys in the result are the dotted paths themselves.
  allMustExist(object: any, pathList_namespace: string[], options?: { errorMessage?: string }): Record<string, any> {
    const result_node: Record<string, any> = {};
    for (const path_namespace of pathList_namespace) {
      result_node[path_namespace] = getMustExist(object, path_namespace, options);
    }
    return result_node;
  },

  // PENDING RENAME
  // extractMustExist(obj, "a.b")
  // Asserts the path exists, removes it from the tree, returns the value.
  // Use when consuming a message or one-time token from a shared tree.
  extractMustExist(object: any, path_namespace: string): any {
    const segments_list        = path_namespace.split(".");
    const leafKey              = segments_list[segments_list.length - 1];
    const foundValue           = getMustExist(object, path_namespace);

    if (segments_list.length === 1) {
      delete object[leafKey];
    } else {
      const parentPath_namespace = segments_list.slice(0, -1).join(".");
      const parent_probed        = getIfExists(object, parentPath_namespace);
      if (parent_probed !== NotFound && isObject(parent_probed)) {
        delete (parent_probed as any)[leafKey];
      }
    }
    return foundValue;
  },

};

// ── remove verbs ─────────────────────────────────────────────────────────────

// rm(object, path)
// Remove the value at path if present; no-op if absent.
// Returns the removed value, or NotFound if the path was absent.
export function rm(object: any, path: string): any {
  const segments = path.split(".");
  const leafKey = segments[segments.length - 1];

  if (segments.length === 1) {
    if (!Object.prototype.hasOwnProperty.call(object, leafKey)) return NotFound;
    const value = object[leafKey];
    delete object[leafKey];
    return value;
  }

  const parentPath = segments.slice(0, -1).join(".");
  const parent = getIfExists(object, parentPath);
  if (parent === NotFound || !isObject(parent)) return NotFound;
  if (!Object.prototype.hasOwnProperty.call(parent, leafKey)) return NotFound;
  const value = (parent as any)[leafKey];
  delete (parent as any)[leafKey];
  return value;
}

// rmMustExist(object, path)
// Remove the value at path. Throws if the path is absent.
// Returns the removed value.
export function rmMustExist(object: any, path: string): any {
  const result = rm(object, path);
  if (result === NotFound) {
    throw new Error(buildErrorMessage(
      `namespace.rmMustExist: path does not exist: "${path}"`,
      object
    ));
  }
  return result;
}

// ── internal helper for complement tree building ─────────────────────────────

function _setDeep(target: any, dottedPath: string, value: any): void {
  const segments = dottedPath.split(".");
  let current = target;
  for (let i = 0; i < segments.length - 1; i++) {
    if (!Object.prototype.hasOwnProperty.call(current, segments[i]) || !isObject(current[segments[i]])) {
      current[segments[i]] = {};
    }
    current = current[segments[i]];
  }
  current[segments[segments.length - 1]] = value;
}

// ── diff/comparison verbs ────────────────────────────────────────────────────

function _equalsRecurse(obj1: any, obj2: any, seen: WeakMap<object, WeakSet<object>>): boolean {
  if (obj1 === obj2) return true;
  if (!isObject(obj1) || !isObject(obj2)) return false;

  let seenSet = seen.get(obj1 as object);
  if (seenSet) {
    if (seenSet.has(obj2 as object)) return true;
  } else {
    seenSet = new WeakSet();
    seen.set(obj1 as object, seenSet);
  }
  seenSet.add(obj2 as object);

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!(key in obj2)) return false;
    if (!_equalsRecurse(obj1[key], obj2[key], seen)) return false;
  }
  return true;
}

export function equals(object1: any, object2: any): boolean {
  if (object1 === object2) return true;
  if (!isObject(object1) || !isObject(object2)) return false;
  return _equalsRecurse(object1, object2, new WeakMap());
}

function _vennRecurse(
  obj1: any, obj2: any,
  fullAddress: string | null,
  result: any,
  compareValues: boolean,
  seen: WeakMap<object, WeakSet<object>>
): void {
  const prefix = fullAddress !== null ? fullAddress + "." : "";

  if (isObject(obj1) && isObject(obj2)) {
    let seenSet = seen.get(obj1 as object);
    if (seenSet && seenSet.has(obj2 as object)) return;
    if (!seenSet) { seenSet = new WeakSet(); seen.set(obj1 as object, seenSet); }
    seenSet.add(obj2 as object);
  }

  let obj2KeyList: string[] | null = null;
  if (isObject(obj2)) obj2KeyList = Object.keys(obj2);

  for (const key of Object.keys(obj1)) {
    const path = prefix + key;
    const value = obj1[key];

    if (!isObject(obj2) || !(key in obj2) || typeof value === "function") {
      result.inOneNotTwo.push(path);
      result.changed = true;
      _setDeep(result.complementOfTwo, path, value);
      continue;
    }

    if (obj2KeyList) {
      const idx = obj2KeyList.indexOf(key);
      if (idx !== -1) obj2KeyList.splice(idx, 1);
    }

    if (isObject(value)) {
      _vennRecurse(value, obj2[key], path, result, compareValues, seen);
    } else if (compareValues && value !== obj2[key]) {
      if (!result.changedValues_list) result.changedValues_list = [];
      result.changedValues_list.push({ path, one: value, two: obj2[key] });
      result.changed = true;
    }
  }

  if (obj2KeyList && obj2KeyList.length > 0) {
    for (const key of obj2KeyList) {
      const path = prefix + key;
      result.inTwoNotOne.push(path);
      result.changed = true;
      _setDeep(result.complementOfOne, path, obj2[key]);
    }
  }
}

export function venn(object1: any, object2: any, options?: { compareValues?: boolean }): any {
  if (!isObject(object1)) {
    throw new Error("namespace.venn: object1 must be an object");
  }

  const result: any = {
    inOneNotTwo: [],
    inTwoNotOne: [],
    complementOfTwo: {},
    complementOfOne: {},
  };

  if (options && options.compareValues) {
    result.changedValues_list = [];
  }

  _vennRecurse(object1, object2, null, result, !!(options && options.compareValues), new WeakMap());

  if (result.changed !== true) return undefined;
  return result;
}

export function graftComplement(target: any, vennData: any, options?: { overwriteStructure?: boolean }): any {
  if (!isObject(target)) throw new Error("namespace.graftComplement: target must be an object");
  if (!isObject(vennData)) throw new Error("namespace.graftComplement: vennData must be an object");

  for (const pathEntry of vennData.inOneNotTwo) {
    const value = getMustExist(vennData.complementOfTwo, pathEntry);
    setOverwrite(target, pathEntry, value, options);
  }
  return target;
}

function _flattenRecurse(obj: any, prefix: string, result: Record<string, any>, seen: WeakSet<object>): void {
  if (seen.has(obj as object)) return;
  seen.add(obj as object);
  for (const key of Object.keys(obj)) {
    const path = prefix ? prefix + "." + key : key;
    const value = obj[key];
    if (isObject(value) && !Array.isArray(value) && Object.keys(value).length > 0) {
      _flattenRecurse(value, path, result, seen);
    } else {
      result[path] = value;
    }
  }
}

export function flatten(object: any): Record<string, any> {
  if (!isObject(object)) throw new Error("namespace.flatten: argument must be an object");
  const result: Record<string, any> = {};
  _flattenRecurse(object, "", result, new WeakSet());
  return result;
}

export function expand(flat: Record<string, any>): any {
  if (!isObject(flat)) throw new Error("namespace.expand: argument must be an object");
  const result: any = {};
  for (const [pathEntry, value] of Object.entries(flat)) {
    _setDeep(result, pathEntry, value);
  }
  return result;
}

// ── bare namespace() ─────────────────────────────────────────────────────────
//
// namespace(object, path)
// Ensure every segment of path exists as a plain object.
//   absent       → vivify as {}
//   plain object → return it
//   anything else (array, string, number, …) → throw
//
// Auto-vivifies intermediates the same way set() does.
// Returns the (possibly freshly created) object at the leaf.

function namespaceEnsure(object: any, dottedPath: string): object {
  if (dottedPath === null || dottedPath === undefined) {
    throw new Error("namespace: path cannot be null or undefined");
  }

  const traversalContext = {
    object,
    address: dottedPath,
    func(pathStep: any) {
      if (!pathStep.keyExists) {
        // absent → vivify
        pathStep.next = pathStep.current[pathStep.addressComponent] = {};
        if (pathStep.finalAddressComponent) {
          pathStep.returnNow = true;
          pathStep.toReturn  = pathStep.next;
        }
      } else if (isObject(pathStep.next) && !Array.isArray(pathStep.next)) {
        // present and plain object → keep going or return
        if (pathStep.finalAddressComponent) {
          pathStep.returnNow = true;
          pathStep.toReturn  = pathStep.next;
        }
      } else {
        // present and not a plain object → throw
        throw new Error(buildErrorMessage(
          `namespace: non-object value exists at "${pathStep.addressComponent}" on path "${dottedPath}"`,
          object
        ));
      }
    }
  };
  traverse(traversalContext);
  return traversalContext.toReturn;
}

// ── default export ────────────────────────────────────────────────────────────

type Namespace = typeof namespaceEnsure & {
  NotFound: Readonly<{ namespaceFunctionConstant: "NotFound" }>;
  configure: typeof configure;
  getIfExists: typeof getIfExists;
  getMustExist: typeof getMustExist;
  getMustEmpty: typeof getMustEmpty;
  getOrDefault: typeof getOrDefault;
  setNotExists: typeof setNotExists;
  setMustExist: typeof setMustExist;
  setOrDefault: typeof setOrDefault;
  setOverwrite: typeof setOverwrite;
  rm: typeof rm;
  rmMustExist: typeof rmMustExist;
  exists: typeof exists;
  isNotFound: typeof isNotFound;
  traverse: typeof traverse;
  path: typeof path;
  batch: typeof batch;
  equals: typeof equals;
  venn: typeof venn;
  graftComplement: typeof graftComplement;
  flatten: typeof flatten;
  expand: typeof expand;
};

const namespace: Namespace = Object.assign(namespaceEnsure, {
  NotFound,
  configure,
  getIfExists,
  getMustExist,
  getMustEmpty,
  getOrDefault,
  setNotExists,
  setMustExist,
  setOrDefault,
  setOverwrite,
  rm,
  rmMustExist,
  exists,
  isNotFound,
  traverse,
  path,
  batch,
  equals,
  venn,
  graftComplement,
  flatten,
  expand,
});

export default namespace;
