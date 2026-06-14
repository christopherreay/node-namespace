/**
 * TypeScript declarations for @visualtools001/namespace
 * 8-verb point-contract API for dotted-path object traversal.
 */

export interface TraversalContext {
  object: any;
  address: string | null;
  addressList?: string[];
  addressListLength?: number;
  index?: number;
  addressComponent?: string;
  current?: any;
  next?: any;
  keyExists?: boolean;
  finalAddressComponent?: boolean;
  returnNow?: boolean;
  toReturn?: any;
  func: (pathStep: TraversalContext) => void;
  [key: string]: any;
}

export interface GetMustExistOptions {
  errorMessage?: string;
}

export interface BatchMustExistOptions {
  errorMessage?: string;
}

/** Frozen sentinel returned by get() when a path is absent. */
export declare const NotFound: Readonly<{ namespaceFunctionConstant: "NotFound" }>;

// ── read verbs ────────────────────────────────────────────────────────────────

/** Returns the value at path, or NotFound if any segment is absent. Never writes. */
export declare function get(object: any, path: string): any;

/** Returns the value, or throws if absent. */
export declare function getMustExist(object: any, path: string, options?: GetMustExistOptions): any;

/** Throws if a value is present at path. Use as a guard before writing to a new slot. */
export declare function getMustEmpty(object: any, path: string): void;

/** Returns the stored value, or standIn if absent. Never writes. */
export declare function getOrDefault(object: any, path: string, standIn: any): any;

// ── write verbs ───────────────────────────────────────────────────────────────

/** Create-only: writes value, throws if path already holds something. Auto-vivifies. */
export declare function set(object: any, path: string, value: any): any;

/** Update-only: writes value, throws if path is absent. Does not auto-vivify. */
export declare function setMustExist(object: any, path: string, value: any): any;

/** Convergence: writes value only if path is absent; returns whichever now holds. Auto-vivifies. */
export declare function setOrDefault(object: any, path: string, value: any): any;

/** Writes unconditionally, clobbering any existing value. Auto-vivifies. */
export declare function setOverwrite(object: any, path: string, value: any): any;

// ── test verbs ────────────────────────────────────────────────────────────────

/** Returns true iff the path holds something — including 0, false, "", null. */
export declare function exists(object: any, path: string): boolean;

/** Returns true iff value is the NotFound sentinel returned by get(). */
export declare function isNotFound(value: any): boolean;

// ── traverse (advanced) ───────────────────────────────────────────────────────

/** Internal traversal engine. Available for advanced tooling. */
export declare function traverse(traversalContext: TraversalContext): any;

// ── namespace.path ────────────────────────────────────────────────────────────

export declare const path: {
  /** join("users", userId, "entries") → "users.alice.entries" */
  join(...parts: (string | string[])[]): string;

  /** Same as join but uses "/" separators. */
  joinSlash(...parts: (string | string[])[]): string;

  /** split("a.b.c") → ["a", "b", "c"] */
  split(dottedPath: string): string[];

  /** Returns true if rootPath is a proper path prefix of targetPath. */
  isRootOf(rootPath: string, targetPath: string): boolean;

  /** tween("a.b.c") → "a.children.b.children.c" */
  tween(dottedPath: string, tweenSegment?: string): string | undefined;
};

// ── namespace.batch ───────────────────────────────────────────────────────────

export declare const batch: {
  /** Returns { localKey: value } for each mapping entry — throws if any path is absent. */
  destructureMustExist(
    object: any,
    mappingDefinition: Record<string, string>,
    options?: BatchMustExistOptions
  ): Record<string, any>;

  /** Returns { "dotted.path": value } for each path in the list — throws if any is absent. */
  allMustExist(
    object: any,
    pathList: string[],
    options?: BatchMustExistOptions
  ): Record<string, any>;

  /** Asserts the path exists, removes it from the tree, returns the value. */
  extractMustExist(object: any, path: string): any;
};

declare const namespace: {
  NotFound: typeof NotFound;
  get: typeof get;
  getMustExist: typeof getMustExist;
  getMustEmpty: typeof getMustEmpty;
  getOrDefault: typeof getOrDefault;
  set: typeof set;
  setMustExist: typeof setMustExist;
  setOrDefault: typeof setOrDefault;
  setOverwrite: typeof setOverwrite;
  exists: typeof exists;
  isNotFound: typeof isNotFound;
  traverse: typeof traverse;
  path: typeof path;
  batch: typeof batch;
};

export default namespace;
