import { isAsyncIterable, isIterable } from "./is";
import {
  assertUnknownJSXNode,
  isKey,
  isKeyIn,
  isLike, isStaticChildNode,
  isUnknownJSXNode,
  ok,
} from "./like";
import { isComponentNode } from "./component";

export type Key = string | symbol;
export type UnknownJSXNodeRecord = Record<Key, unknown>;
export type UnknownJSXNode = UnknownJSXNodeRecord;

export const JSXFragment = Symbol.for(":jsx/fragment");
export const KDLFragment = Symbol.for(":kdl/fragment");
export const VSXFringeFragment = Symbol.for("@virtualstate/fringe/fragment");

const possibleFragmentNames = [
  JSXFragment,
  KDLFragment,
  VSXFringeFragment,
  "Fragment",
  "fragment",
] as const;
export type FragmentName = typeof possibleFragmentNames[number];

export const possibleNameKeysStrings = [
  "source",
  "type",
  "$$type",
  "reference",
  "name",
  "tagName",
  "nodeName"
] as const;
export const possibleNameKeys = [
  Symbol.for(":kdl/name"),
  Symbol.for(":jsx/type"),
  Symbol.for("@virtualstate/fringe/source"),
  ...possibleNameKeysStrings,
] as const;
export const possibleTagKeysStrings = ["tag"] as const;
export const possibleTagKeys = [
  Symbol.for(":kdl/tag"),
  ...possibleTagKeysStrings,
] as const;
export const possiblePropertiesKeysStrings = [
  "properties",
  "props",
  "options",
  "attributes",
  "attrs",
  "attribs"
] as const;
export const possiblePropertiesKeys = [
  Symbol.for(":kdl/properties"),
  Symbol.for(":kdl/props"),
  Symbol.for(":jsx/props"),
  Symbol.for(":jsx/properties"),
  Symbol.for(":jsx/options"),
  Symbol.for("@virtualstate/fringe/options"),
  ...possiblePropertiesKeysStrings,
] as const;
export const possibleValuesKeysStrings = ["values"] as const;
export const possibleValuesKeys = [
  Symbol.for(":kdl/values"),
  Symbol.for(":jsx/values"),
  ...possibleValuesKeysStrings,
] as const;
export const possibleValueChildrenKeysStrings = ["textContent", "data", "value", "nodeValue"] as const;
export const possibleChildrenKeysStrings = ["childNodes", "children", "_children", ...possibleValueChildrenKeysStrings] as const;
export const possibleChildrenKeys = [
  Symbol.for(":kdl/children"),
  Symbol.for(":jsx/children"),
  Symbol.for("@virtualstate/fringe/children"),
  ...possibleChildrenKeysStrings,
] as const;

export const possibleInstanceKeysStrings = [
  "instance",
  "sourceInstance",
  "typeInstance",
  "$$typeInstance",
  "referenceInstance",
  "nameInstance",
] as const;
export const possibleInstanceKeys = [
  Symbol.for(":kdl/instance"),
  Symbol.for(":jsx/instance"),
  Symbol.for("@virtualstate/fringe/instance"),
  Symbol.for("@virtualstate/fringe/SourceInstance"),
  ...possibleInstanceKeysStrings,
] as const;
const Raw = Symbol.for("@virtualstate/fringe/tools/raw");
export const possibleRawKeys = [
  Symbol.for(":kdl/raw"),
  Symbol.for(":jsx/raw"),
  Symbol.for("@virtualstate/fringe/raw"),
  Raw,
] as const;

export type NameKeys = typeof possibleNameKeys[number];
export type PropertiesKeys = typeof possiblePropertiesKeys[number];
export type ChildrenKeys = typeof possibleChildrenKeys[number];
export type ValueKeys = typeof possibleValuesKeys[number];
export type TagKeys = typeof possibleTagKeys[number];
export type InstanceKeys = typeof possibleInstanceKeys[number];
export type RawKeys = typeof possibleRawKeys[number];

export type NameAccessors = Record<NameKeys, ReturnType<typeof name>>;
export type PropertiesAccessors = Record<
  PropertiesKeys,
  ReturnType<typeof properties>
>;
export type ChildrenAccessors = Record<
  ChildrenKeys,
  ReturnType<typeof getChildrenFromRawNode>
>;
export type ValuesAccessors = Record<ValueKeys, ReturnType<typeof values>>;
export type TagAccessors = Record<TagKeys, ReturnType<typeof tag>>;
export type InstanceAccessors = Record<
  InstanceKeys,
  ReturnType<typeof instance>
>;
export type RawAccessors = Record<RawKeys, ReturnType<typeof raw>>;

export type GenericAccessors = NameAccessors &
  PropertiesAccessors &
  ChildrenAccessors &
  ValuesAccessors &
  TagAccessors &
  InstanceAccessors &
  RawAccessors;

interface GenericGetFn {
  (node: UnknownJSXNode, context?: unknown): unknown;
}
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}
export type GettersRecord = Partial<Record<string | symbol, GenericGetFn>>;
const GenericNodeFunctions: GettersRecord = Object.fromEntries([
  ...possibleNameKeys.map((key) => pair(key, name)),
  ...possibleTagKeys.map((key) => pair(key, tag)),
  ...possibleChildrenKeys.map((key) => pair(key, getChildrenFromRawNode)),
  ...possiblePropertiesKeys.map((key) => pair(key, properties)),
  ...possibleValuesKeys.map((key) => pair(key, values)),
  ...possibleInstanceKeys.map((key) => pair(key, instance)),
  ...possibleRawKeys.map((key) => pair(key, raw)),
]);

export type StaticChildNode = string | number | boolean;

export function isFragment(node: unknown): boolean {
  if (!node) return false;
  if (!isUnknownJSXNode(node)) return false;
  if (isComponentNode(node)) return true;
  const unknown: ReadonlyArray<unknown> = possibleFragmentNames;
  if (unknown.includes(name(node))) {
    return true;
  }
  return isFragmentValue(node);
}

type GettersRecordKeys<
  Get extends GettersRecord,
  K extends keyof Get = keyof Get
> = string | symbol extends K ? never : K;

export type RawNode<N> = {
  __raw?: typeof Raw;
  [Raw]: N;
};
export type RawNodeValue<N> = N extends RawNode<infer R>
  ? R extends RawNode<unknown>
    ? RawNodeValue<R>
    : R
  : N;

// export type GenericAccessorThis<K, N, R> = {
//   __key: K;
//   __input: N;
//   __return: R;
// }

// interface GetAccessorFnValueGet<N, R> {
//   (node: N, arg: unknown, returnType1: [R, R, N]): [R, R, R, N, R, N]
// }
// interface GetAccessorFnValueGet<N, R> {
//   (node: N): R
// }

type GetAccessorFnValue<A extends GenericGetFn, N> =
  // A extends GetAccessorFnValueGet<infer NN, infer R> ? R :
  ReturnType<A>;

export type ProxyNode<
  Get extends GettersRecord,
  N = UnknownJSXNode
> = UnknownJSXNode & {
  [K in GettersRecordKeys<Get>]: Get[K] extends GenericGetFn
    ? GetAccessorFnValue<Get[K], N>
    : never;
} & {
  [K in keyof Omit<
    GenericAccessors,
    GettersRecordKeys<Get>
  >]: GenericAccessors[K];
} & RawNode<N>;

export interface ProxyContextOptions {
  proxy: typeof proxy;
  getters?: GettersRecord;
}

export function isProxyContextOptions(
  options: unknown
): options is ProxyContextOptions {
  return (
    isLike<ProxyContextOptions>(options) && typeof options.proxy === "function"
  );
}

export function proxy<
  Get extends GettersRecord = GettersRecord,
  Context extends ProxyContextOptions = ProxyContextOptions,
  N = unknown
>(node: N, getters?: Get, context?: Context): ProxyNode<Get, N>;
export function proxy<Get extends GettersRecord = GettersRecord, N = unknown>(
  node: N,
  getters?: Get
): ProxyNode<Get, N>;
export function proxy<Get extends GettersRecord = GettersRecord, N = unknown>(
  node: N,
  getters?: Get,
  context?: unknown
): ProxyNode<Get, N> {
  assertUnknownJSXNode(node);
  const nodeInstance = (getters?.instance ?? instance)(node);
  const source = isUnknownJSXNode(nodeInstance) ? nodeInstance : node;
  const target = new Proxy(source, {
    getPrototypeOf() {
      // Temp fix as per https://github.com/denoland/deno/issues/14164
      return nodeInstance instanceof Date
        ? node
        : Object.getPrototypeOf(source);
    },
    get(target, p) {
      if (includesKey(p, possibleRawKeys)) {
        return raw(node);
      }
      if (includesKey(p, possibleInstanceKeys)) {
        // Even return if undefined, saves resolution later
        return nodeInstance;
      }
      if (
        isUnknownJSXNode(nodeInstance) &&
        (isKeyIn(nodeInstance, p) || isKey(nodeInstance, p))
      ) {
        const value = nodeInstance[p];
        if (typeof value === "function") {
          return value.bind(nodeInstance);
        }
        return value;
      }
      return get(p, node, getters, context);
    },
    set(target, p, value): boolean {
      if (isUnknownJSXNode(nodeInstance)) {
        nodeInstance[p] = value;
      }
      return true;
    },
  });
  ok<ProxyNode<Get, N>>(target);
  return target;
}

function includesKey(key: Key, keys: readonly Key[]) {
  return keys.includes(key);
}

function get(
  key: string | symbol,
  node: unknown,
  getters?: GettersRecord,
  context?: unknown
): unknown {
  assertUnknownJSXNode(node);
  const fn = getters?.[key] ?? GenericNodeFunctions[key];
  if (!fn) {
    return undefined;
  }
  return fn(node, context);
}

export function name(node: UnknownJSXNode): string | symbol | undefined;
export function name(node: unknown): string | symbol | undefined;
export function name(node: UnknownJSXNode): string | symbol | undefined {
  const [maybeNode, nameKey] = getNameAndKeyFromRawNode(node);
  if (isUnknownJSXNode(maybeNode)) {
    return name(maybeNode);
  }
  return getStringOrSymbol(node, nameKey);
}

function getNameAndKeyFromRawNode(node: UnknownJSXNode) {
  const nameKey = getNameKey(node);
  return [node?.[nameKey], nameKey] as const;
}

export function getNameKey(node: UnknownJSXNode) {
  return possibleNameKeys.find((key) => isKey(node, key));
}

export function tag(node: UnknownJSXNode): string | symbol | undefined;
export function tag(node: unknown): string | symbol | undefined;
export function tag(node: UnknownJSXNode): string | symbol | undefined {
  const tagKey = possibleTagKeys.find((key) => isKey(node, key));
  return getStringOrSymbol(node, tagKey);
}

export function properties(node: UnknownJSXNode): PropertiesRecord;
export function properties(node: unknown): PropertiesRecord;
export function properties(node: UnknownJSXNode): PropertiesRecord {
  const [maybeNode] = getNameAndKeyFromRawNode(node);
  let maybeNodeProperties = undefined;
  if (isUnknownJSXNode(maybeNode)) {
    maybeNodeProperties = properties(maybeNode);
  }
  const propertiesKey = possiblePropertiesKeys.find((key) => isKey(node, key));
  const record = getPropertiesRecord(node, propertiesKey);
  if (!maybeNodeProperties) return record;
  return {
    ...maybeNodeProperties,
    ...record
  };
}

export function values(node: UnknownJSXNode): Iterable<unknown>;
export function values(node: unknown): Iterable<unknown>;
export function values(node: UnknownJSXNode): Iterable<unknown> {
  const valuesKey = possibleValuesKeys.find((key) => isKey(node, key));
  const value = node?.[valuesKey];
  if (isIterable(value)) return value;
  return [];
}

/**
 * @internal
 */
export function getChildrenFromRawNode(node: unknown): unknown {
  assertUnknownJSXNode(node);
  const { value, children } = getValueOrChildrenFromRawNode(node);
  if (value || isStaticChildNode(value)) return value;
  return children;
}

function getValueOrChildrenFromRawNode(node: UnknownJSXNode): { value?: unknown, children?: unknown } {
  const children = getInternalChildrenFromRawNode(node);
  const isMaybeValueKey = possibleValueChildrenKeysStrings.find(key => isKey(node, key));
  if (!isMaybeValueKey) return { children };
  const value = getInternalChildrenFromRawNode(node, [isMaybeValueKey]);
  if (isStaticChildNode(value)) {
    if (children === value || (!children && value)) {
      return { value };
    }
    if (isLike<{ length: number, [0]: unknown }>(children) && children.length === 0) {
      return { value };
    }
  }
  return { children };
}

function isFragmentValue(node: UnknownJSXNode) {
  const { value } = getValueOrChildrenFromRawNode(node);
  return !!(value || isStaticChildNode(value));
}

/**
 * @internal
 */
function getInternalChildrenFromRawNode(node: UnknownJSXNode, keys: Key[] | readonly Key[] = possibleChildrenKeys): unknown {
  const [maybeNode] = getNameAndKeyFromRawNode(node);
  let maybeNodeChildren = undefined;
  if (isUnknownJSXNode(maybeNode)) {
    maybeNodeChildren = getInternalChildrenFromRawNode(maybeNode, keys);
  }
  const resolvedKeys: (Key[] | readonly Key[]) = Array.isArray(keys) ? keys : possibleChildrenKeys;
  const childrenKey = resolvedKeys.find((key) => isKey(node, key));
  const children = getSyncOrAsyncChildren(node, childrenKey);
  if (!maybeNodeChildren) return children ?? [];
  if (!children) return maybeNodeChildren ?? [];
  if (!Array.isArray(children)) return children;
  if (children.length) return children;
  if (Array.isArray(maybeNodeChildren) && !maybeNodeChildren.length) return children;
  return maybeNodeChildren;
}

function getSyncOrAsyncChildren(
  node: UnknownJSXNode,
  key: Key
): AsyncIterable<unknown> | Iterable<unknown> {
  type Indexed = { length: number } & Record<number, unknown>;

  if (!key) return [];
  const value = node?.[key];
  return getIterableChildren();

  function getIterableChildren() {
    if (isIterable(value)) return value;
    if (isAsyncIterable(value)) return value;
    if (isIndexed(value)) return indexed(value);
    return undefined;
  }

  function indexed(value: Indexed) {
    return {
      *[Symbol.iterator]() {
        yield * Array.from(value);
      }
    }
  }

  function isIndexed(value: unknown): value is Indexed {
    return isLike<Indexed>(value) && typeof value.length === "number";
  }
}

export type PropertiesRecord = Record<string | symbol | number, unknown>;

function getPropertiesRecord(node: UnknownJSXNode, key: Key): PropertiesRecord {
  if (!key) return {};
  const value = node?.[key];
  if (!isProperties(value)) return {};
  if (isIterable(value)) {
    return getIterableRecord(value);
  }
  return value;
  function isProperties(value: unknown): value is PropertiesRecord {
    return typeof value === "object" || typeof value === "function";
  }

  function getIterableRecord(value: Iterable<unknown>): PropertiesRecord {
    const entries = Array.from(value).map(
        (node) => [name(node), getChildrenFromRawNode(node)]
    );
    return Object.fromEntries(entries);
  }
}

function getStringOrSymbol(node: UnknownJSXNode, key: Key) {
  const value = node?.[key];
  if (typeof value !== "string" && typeof value !== "symbol") return undefined;
  return value;
}

export function instance(node: UnknownJSXNode): unknown;
export function instance(node: unknown): unknown;
export function instance(node: UnknownJSXNode): unknown {
  const instanceKey = possibleInstanceKeys.find((key) => isKey(node, key));
  if (!instanceKey) return undefined;
  return node?.[instanceKey];
}

export function raw(node: UnknownJSXNode): UnknownJSXNode;
export function raw(node: unknown): UnknownJSXNode;
export function raw(node: UnknownJSXNode): UnknownJSXNode {
  const rawKey = possibleRawKeys.find((key) => isKey(node, key));
  if (!rawKey) return node;
  const value = node?.[rawKey];
  ok<UnknownJSXNode>(value);
  return value;
}
