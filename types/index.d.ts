/**
 * TypeScript definitions for namespace
 * Zero-dependency dotted-path object utilities
 */

export interface NamespaceOptions {
  /** Enable debugging breakpoints during traversal */
  debugging?: boolean;
}

export interface GetIfExistsOptions extends NamespaceOptions {
  /** Return this value instead of NotFound sentinel when path doesn't exist */
  defaultValueToReturn?: any;
}

export interface GetMustExistOptions extends NamespaceOptions {
  /** Custom error message when path doesn't exist */
  errorMessage?: string;
}

export interface SetValueOptions extends NamespaceOptions {
  /** Allow overwriting existing values (default: false for safety) */
  overwrite?: boolean;
  /** Validate without making changes */
  dryRun?: boolean;
  /** Fail silently instead of throwing errors */
  ignoreErrors?: boolean;
  /** Force overwrite of non-object hierarchy */
  hardWriteHierarchy?: boolean;
}

export interface Traveller {
  object: any;
  address: string | null;
  addressList?: string[];
  addressListLength?: number;
  index?: number;
  addressComponent?: string;
  current?: any;
  next?: any;
  finalAddressComponent?: boolean;
  returnNow?: boolean;
  toReturn?: any;
  func?: (traveller: Traveller) => void;
  [key: string]: any;
}

/**
 * Get or create a namespace path, auto-vivifying intermediate objects.
 */
declare function namespace(
  object: any,
  address: string | null,
  defaultList?: string[],
  checkExists?: boolean | string
): any;

declare namespace namespace {
  /** NotFound sentinel — frozen object indicating path not found */
  export const NotFound: Readonly<{ namespaceFunctionConstant: "NotFound" }>;

  export function isNotFound(value: any, address?: string): boolean;

  export function exists(object: any, address: string): boolean;

  export function getIfExists(object: any, address: string, options?: GetIfExistsOptions): any;

  export function getMustExist(object: any, address: string, options?: GetMustExistOptions): any;

  export function setValue(object: any, address: string, value: any, options?: SetValueOptions): any;

  export function remove(object: any, address: string): boolean;

  export function leafNode(object: any, address: string, leafValue: any): any;

  export function join(...parts: (string | string[])[]): string;

  export function flatten(
    objectToFlatten: any,
    currentNamespace?: string,
    toReturn?: Record<string, any>
  ): Record<string, any>;

  export function expand(flatObject: Record<string, any>): any;

  export function traverse(traveller: Traveller): any;
}

export default namespace;
