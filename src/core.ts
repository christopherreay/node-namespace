// NotFound sentinel — frozen; returned by get() when a path is absent
export const NotFound = Object.freeze({ namespaceFunctionConstant: "NotFound" });

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
    throw new Error("namespace: object is not a valid root");
  }

  if (dottedAddress === null) {
    traversalContext.toReturn = rootObject;
    return;
  }

  if (!isString(dottedAddress)) {
    throw new Error("namespace: address must be a string: " + dottedAddress);
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

// get(object, path)
// Returns the value at path, or the NotFound sentinel if any segment is absent.
// Never writes.
export function get(object: any, path: string): any {
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
  const foundValue_probed = get(object, path);
  if (foundValue_probed === NotFound) {
    const errorMessage =
      (options && options.errorMessage) ||
      `namespace.getMustExist: property not found at "${path}"`;
    throw new Error(errorMessage);
  }
  return foundValue_probed;
}

// getMustEmpty(object, path)
// Throws if a value is present at path.  Returns nothing useful.
// Use as a guard on its own line before writing to a slot you know is new.
export function getMustEmpty(object: any, path: string): void {
  const foundValue_probed = get(object, path);
  if (foundValue_probed !== NotFound) {
    throw new Error(`namespace.getMustEmpty: path must be empty but value found at "${path}"`);
  }
}

// getOrDefault(object, path, standIn)
// Returns the stored value, or standIn if absent.  standIn is a required
// positional argument — if you want the sentinel, use get().  Never writes.
export function getOrDefault(object: any, path: string, standIn: any): any {
  const foundValue_probed = get(object, path);
  return foundValue_probed === NotFound ? standIn : foundValue_probed;
}

// ── write verbs ───────────────────────────────────────────────────────────────

// set(object, path, value)
// Create-only: writes value, throws if path already holds something.
// Auto-vivifies missing intermediate objects.
export function set(object: any, path: string, valueToSet: any): any {
  if (path === null) throw new Error("namespace.set: path cannot be null");

  const traversalContext = {
    object,
    address:    path,
    valueToSet,
    func(pathStep: any) {
      if (!pathStep.finalAddressComponent) {
        if (!pathStep.keyExists) {
          pathStep.next = pathStep.current[pathStep.addressComponent] = {};
        } else if (!isObject(pathStep.next)) {
          throw new Error(
            `namespace.set: cannot traverse through non-object at "${pathStep.addressComponent}" on path "${path}"`
          );
        }
      } else {
        if (pathStep.keyExists) {
          throw new Error(`namespace.set: cannot overwrite existing value at "${path}"`);
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
          throw new Error(`namespace.setMustExist: path does not exist: "${path}"`);
        }
      } else {
        if (!pathStep.keyExists) {
          throw new Error(`namespace.setMustExist: path must exist but is absent: "${path}"`);
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
          throw new Error(
            `namespace.setOrDefault: cannot traverse through non-object at "${pathStep.addressComponent}" on path "${path}"`
          );
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

// setOverwrite(object, path, value)
// Writes unconditionally, clobbering any existing value.
// Auto-vivifies missing intermediate objects.
// The long name is the signal: you mean to clobber.
export function setOverwrite(object: any, path: string, valueToSet: any): any {
  if (path === null) throw new Error("namespace.setOverwrite: path cannot be null");

  const traversalContext = {
    object,
    address:    path,
    valueToSet,
    func(pathStep: any) {
      if (!pathStep.finalAddressComponent) {
        if (!pathStep.keyExists || !isObject(pathStep.next)) {
          pathStep.next = pathStep.current[pathStep.addressComponent] = {};
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
  return get(object, path) !== NotFound;
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

export const path = {

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

export const batch = {

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
      const parent_probed        = get(object, parentPath_namespace);
      if (parent_probed !== NotFound && isObject(parent_probed)) {
        delete (parent_probed as any)[leafKey];
      }
    }
    return foundValue;
  },

};

// ── default export ────────────────────────────────────────────────────────────

const namespace = {
  NotFound,
  get,
  getMustExist,
  getMustEmpty,
  getOrDefault,
  set,
  setMustExist,
  setOrDefault,
  setOverwrite,
  exists,
  isNotFound,
  traverse,
  path,
  batch,
};

export default namespace;
