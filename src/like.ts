import {
  DescendantPromiseFulfilledResult,
  DescendantPromiseRejectedResult,
  DescendantPromiseSettledResult,
} from "./children";
import {
  getNameKey,
  Key,
  raw,
  StaticChildNode,
  UnknownJSXNode,
} from "./access";
import {isAsyncIterable} from "./is";

export type GenericNode = unknown;

export function isLike<T>(value: unknown, ...and: unknown[]): value is T {
  if (!and.length) return !!value;
  return !!value && and.every((value) => !!value);
}

export function ok(
  value: unknown,
  message?: string,
  ...conditions: unknown[]
): asserts value;
export function ok<T>(
  value: unknown,
  message?: string,
  ...conditions: unknown[]
): asserts value is T;
export function ok(
  value: unknown,
  message?: string,
  ...conditions: unknown[]
): asserts value {
  if (conditions.length ? !conditions.every((value) => value) : !value) {
    throw new Error(message ?? "Expected value");
  }
}

export function isRejected<R extends PromiseRejectedResult>(
  value: PromiseSettledResult<unknown>
): value is R {
  return value?.status === "rejected";
}

export function assertFulfilled<T>(
  status: PromiseSettledResult<T>
): asserts status is PromiseFulfilledResult<T> {
  if (isFulfilled(status)) return;
  throw status.reason;
}

export function isFulfilled<T>(
  value: PromiseSettledResult<T>
): value is PromiseFulfilledResult<T> {
  return value?.status === "fulfilled";
}

export function isDescendantFulfilled(
  result: DescendantPromiseSettledResult
): result is DescendantPromiseFulfilledResult {
  return isFulfilled(result);
}

export function isDescendantRejected(
  result: DescendantPromiseSettledResult
): result is DescendantPromiseRejectedResult {
  return isRejected(result);
}

export function isKeyIn<U, K extends string | symbol | number>(
  unknown: U,
  key: K
): unknown is U & Record<K, unknown> {
  return (
    !!unknown &&
    (typeof unknown === "object" || typeof unknown === "function") &&
    key in unknown
  );
}

export function isKey(unknown: UnknownJSXNode, key: Key): key is Key;
export function isKey<K extends Key>(unknown: unknown, key: K): key is K;
export function isKey<K extends Key>(unknown: unknown, key: unknown): key is Key;
export function isKey(unknown: UnknownJSXNode, key: unknown): key is Key {
  if (!unknown) return false;
  if (!isKeyValue(key)) return false;
  const value = unknown[key];
  return typeof value !== "undefined" && value !== null;
}

function isKeyValue(key: unknown): key is Key {
  return (
      typeof key === "string" ||
      typeof key === "symbol" ||
      typeof key === "number"
  );
}

export function isStaticChildNode(node: unknown): node is StaticChildNode {
  return (
    typeof node === "string" ||
    typeof node === "boolean" ||
    typeof node === "number" ||
    typeof node === "symbol" ||
    typeof node === "bigint"
  );
}

export function isNode<T extends UnknownJSXNode>(node: unknown): node is T {
  return isUnknownJSXNode(node);
}

export function isUnknownJSXNode(node: unknown): node is UnknownJSXNode {
  return !!node && (typeof node === "object" || typeof node === "function");
}

export function assertUnknownJSXNode(
  node: unknown
): asserts node is UnknownJSXNode {
  ok(isUnknownJSXNode(node), "Expected Node");
}

export function isGenericChildNode(node: unknown): node is GenericNode {
  return !isStaticChildNode(node);
}

export interface ComponentFn {
  (options: Record<string | symbol, unknown>, input?: UnknownJSXNode): void;
  new (
    options: Record<string | symbol, unknown>,
    input?: UnknownJSXNode
  ): unknown;
}

export function isComponentFn(node: unknown): node is ComponentFn {
  return isLike(node, typeof node === "function") && !isAsyncIterable(node);
}

export function isComponentNode(input: unknown): boolean {
  if (!isUnknownJSXNode(input)) return false;
  const node = raw(input);
  if (isComponentFn(node)) return true;
  const name = node[getNameKey(node)];
  return isComponentFn(name);
}

export function isPromise(input: unknown): input is Promise<unknown> {
  return isUnknownJSXNode(input) && typeof input.then === "function";
}

export function isSymbol(value: unknown): value is symbol {
  return typeof value === "symbol";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}