import { isAsyncIterable, isIterable } from "./is";
import {
  assertUnknownJSXNode,
  isKey,
  isKeyIn,
  isLike,
  isUnknownJSXNode,
  ok,
} from "./like";
import {isComponentNode} from "./component";

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
export const possibleChildrenKeysStrings = ["children", "_children"] as const;
export const possibleChildrenKeys = [
  Symbol.for(":kdl/children"),
  Symbol.for(":jsx/children"),
  Symbol.for("@virtualstate/fringe/children"),
  "children",
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
  Raw
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
export type RawAccessors = Record<
  RawKeys,
  ReturnType<typeof raw>
>;

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
// export type AnyStaticChildNode = string | number | boolean | null | undefined;
// export type ChildNode = AnyStaticChildNode | UnknownJSXNode;

//
// export interface GenericNode extends UnknownJSXNodeRecord {
//     name?: string | symbol;
//     tag?: string | symbol;
//     props: Record<string, unknown>;
//     values: Iterable<AnyStaticChildNode>;
//     children: AsyncIterable<ChildNode[]> | Iterable<ChildNode>;
// }

export interface FragmentNode extends UnknownJSXNode {}

export function isFragment(node: unknown): node is FragmentNode {
  if (!node) return false;
  if (!isUnknownJSXNode(node)) return false;
  if (isComponentNode(node)) return true;
  const unknown: ReadonlyArray<unknown> = possibleFragmentNames;
  return unknown.includes(name(node));
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
    get(target, p) {
      if (typeof p === "symbol" && possibleRawKeys.includes(p)) {
        return raw(node);
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
  const nameKey = getNameKey(node);
  const value = node[nameKey];
  if (isUnknownJSXNode(value)) {
    return name(value);
  }
  return getStringOrSymbol(node, nameKey);
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
  const propertiesKey = possiblePropertiesKeys.find((key) => isKey(node, key));
  return getPropertiesRecord(node, propertiesKey);
}

export function values(node: UnknownJSXNode): Iterable<unknown>;
export function values(node: unknown): Iterable<unknown>;
export function values(node: UnknownJSXNode): Iterable<unknown> {
  const valuesKey = possibleValuesKeys.find((key) => isKey(node, key));
  const value = node[valuesKey];
  if (isIterable(value)) return value;
  return [];
}

/**
 * @internal
 * @param node
 */
export function getChildrenFromRawNode(node: UnknownJSXNode) {
  const childrenKey = possibleChildrenKeys.find((key) => isKey(node, key));
  return getSyncOrAsyncChildren(node, childrenKey);
}

function getSyncOrAsyncChildren(
  node: UnknownJSXNode,
  key: Key
): AsyncIterable<unknown> | Iterable<unknown> {
  if (!key) return [];
  const value = node[key];
  return getIterableChildren();

  function getIterableChildren() {
    if (Array.isArray(value)) return value;
    if (isIterable(value)) return value;
    if (isAsyncIterable(value)) return value;
    return [];
  }
}

export type PropertiesRecord = Record<string | symbol | number, unknown>;

function getPropertiesRecord(node: UnknownJSXNode, key: Key): PropertiesRecord {
  if (!key) return {};
  const value = node[key];
  if (!isProperties(value)) return {};
  return value;
  function isProperties(value: unknown): value is PropertiesRecord {
    return typeof value === "object" || typeof value === "function";
  }
}

function getStringOrSymbol(node: UnknownJSXNode, key: Key) {
  const value = node[key];
  if (typeof value !== "string" && typeof value !== "symbol") return undefined;
  return value;
}

export function instance(node: UnknownJSXNode): unknown;
export function instance(node: unknown): unknown;
export function instance(node: UnknownJSXNode): unknown {
  const instanceKey = possibleInstanceKeys.find((key) => isKey(node, key));
  if (!instanceKey) return undefined;
  return node[instanceKey];
}


export function raw(node: UnknownJSXNode): UnknownJSXNode;
export function raw(node: unknown): UnknownJSXNode;
export function raw(node: UnknownJSXNode): UnknownJSXNode {
  const rawKey = possibleRawKeys.find((key) => isKey(node, key));
  if (!rawKey) return node;
  const value = node[rawKey];
  ok<UnknownJSXNode>(value);
  return value;
}
