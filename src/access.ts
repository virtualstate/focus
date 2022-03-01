import { isAsyncIterable, isIterable } from "./is";
import { isLike, ok } from "./like";
import {createFragment} from "./static-h";

export type Key = string | symbol;
export type UnknownJSXNodeRecord = Record<Key, unknown>;
export type UnknownJSXNode = UnknownJSXNodeRecord;

const NameKeySymbol = Symbol();
const TagKeySymbol = Symbol();
const PropertiesKeySymbol = Symbol();
const ValuesKeySymbol = Symbol();
const ChildrenKeySymbol = Symbol();

export const JSXFragment = Symbol.for(":jsx/fragment");
export const KDLFragment = Symbol.for(":kdl/fragment");
export const VSXFringeFragment = Symbol.for("@virtualstate/fringe/fragment");

const possibleFragmentNamesSource = [
  JSXFragment,
  KDLFragment,
  VSXFringeFragment,
  "Fragment",
  "fragment",
] as const;
const possibleFragmentNames: Key[] = [...possibleFragmentNamesSource];
export type FragmentName = ValuesOf<typeof possibleFragmentNamesSource>;

export const possibleNameKeys = [
  Symbol.for(":kdl/name"),
  Symbol.for(":jsx/type"),
  Symbol.for("@virtualstate/fringe/source"),
  "source",
  "type",
  "$$type",
  "reference",
  "name",
] as const;
export const possibleTagKeys = [Symbol.for(":kdl/tag"), "tag"] as const;
export const possiblePropertiesKeys = [
  Symbol.for(":kdl/properties"),
  Symbol.for(":kdl/props"),
  Symbol.for(":jsx/props"),
  Symbol.for(":jsx/properties"),
  Symbol.for(":jsx/options"),
  Symbol.for("@virtualstate/fringe/options"),
  "properties",
  "props",
  "options",
] as const;
export const possibleValuesKeys = [
  Symbol.for(":kdl/values"),
  Symbol.for(":jsx/values"),
  "values",
] as const;
export const possibleChildrenKeys = [
  Symbol.for(":kdl/children"),
  Symbol.for(":jsx/children"),
  Symbol.for("@virtualstate/fringe/children"),
  "children",
  "_children",
] as const;

type ValuesOf<T> = T extends ReadonlyArray<infer I>
  ? I
  : T extends Array<infer I>
  ? I
  : never;

export type NameAccessors = Record<
  ValuesOf<typeof possibleNameKeys>,
  ReturnType<typeof getName>
>;
export type PropertiesAccessors = Record<
  ValuesOf<typeof possiblePropertiesKeys>,
  ReturnType<typeof getProperties>
>;
export type ChildrenAccessors = Record<
  ValuesOf<typeof possibleChildrenKeys>,
  ReturnType<typeof getChildren>
>;
export type ValuesAccessors = Record<
  ValuesOf<typeof possibleValuesKeys>,
  ReturnType<typeof getValues>
>;
export type TagAccessors = Record<
  ValuesOf<typeof possibleTagKeys>,
  ReturnType<typeof getTag>
>;

export type GenericAccessors = NameAccessors &
  PropertiesAccessors &
  ChildrenAccessors &
  ValuesAccessors &
  TagAccessors;

interface GenericGetFn {
  (node: UnknownJSXNode, context?: unknown): unknown;
}
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}
export type GettersRecord = Partial<Record<string | symbol, GenericGetFn>>;
const GenericNodeFunctions: GettersRecord = Object.fromEntries([
  ...possibleNameKeys.map((key) => pair(key, getName)),
  ...possibleTagKeys.map((key) => pair(key, getTag)),
  ...possibleChildrenKeys.map((key) => pair(key, getChildren)),
  ...possiblePropertiesKeys.map((key) => pair(key, getProperties)),
  ...possibleValuesKeys.map((key) => pair(key, getValues)),
]);

export type StaticChildNode = string | number | boolean;
export type AnyStaticChildNode = string | number | boolean | null | undefined;
export type ChildNode = AnyStaticChildNode | UnknownJSXNode;
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
  return possibleFragmentNames.includes(getName(node));
}

type GettersRecordKeys<
  Get extends GettersRecord,
  K extends keyof Get = keyof Get
> = string | symbol extends K ? never : K;

export type ProxyNode<Get extends GettersRecord> = UnknownJSXNode & {
  [K in GettersRecordKeys<Get>]: Get[K] extends GenericGetFn
    ? ReturnType<Get[K]>
    : never;
} & {
  [K in keyof Omit<
    GenericAccessors,
    GettersRecordKeys<Get>
  >]: GenericAccessors[K];
};

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

const Raw = Symbol.for("@virtualstate/fringe/tools/raw");

export function raw(node: UnknownJSXNode): UnknownJSXNode {
  const value = node[Raw] ?? node;
  ok<UnknownJSXNode>(value);
  return value;
}

export function proxy<
  Get extends GettersRecord = GettersRecord,
  Context extends ProxyContextOptions = ProxyContextOptions
>(node: unknown, getters: Get, context: Context): ProxyNode<Get>;
export function proxy<Get extends GettersRecord = GettersRecord>(
  node: unknown,
  getters?: Get
): ProxyNode<Get>;
export function proxy<Get extends GettersRecord = GettersRecord>(
  node: unknown,
  getters?: Get,
  context?: unknown
): ProxyNode<Get> {
  assertUnknownJSXNode(node);
  const target = new Proxy(node, {
    get(target: UnknownJSXNode, p: string | symbol) {
      return get(p, node, getters, context);
    },
  });
  ok<ProxyNode<Get>>(target);
  return target;
}

export function get(
  key: string | symbol,
  node: unknown,
  getters?: GettersRecord,
  context?: unknown
): unknown {
  assertUnknownJSXNode(node);
  if (key === Raw) {
    return node;
  }
  const fn = getters?.[key] ?? GenericNodeFunctions[key];
  if (!fn) {
    return undefined;
  }
  return fn(node, context);
}

export function getName(node: UnknownJSXNode): string | symbol | undefined {
  const nameKey = getNameKey(node);
  const value = node[nameKey];
  if (isUnknownJSXNode(value)) {
    return getName(value);
  }
  return getStringOrSymbol(node, nameKey);
}

export function getNameKey(node: UnknownJSXNode) {
  return possibleNameKeys.find((key) => isKey(node, key));
}

export function getTag(node: UnknownJSXNode) {
  const tagKey = possibleTagKeys.find((key) => isKey(node, key));
  return getStringOrSymbol(node, tagKey);
}

export function getProperties(node: UnknownJSXNode) {
  const propertiesKey = possiblePropertiesKeys.find((key) => isKey(node, key));
  return getPropertiesRecord(node, propertiesKey);
}

export function getValues(node: UnknownJSXNode) {
  const valuesKey = possibleValuesKeys.find((key) => isKey(node, key));
  const value = node[valuesKey];
  if (isIterable(value)) return value;
  return [];
}

export function getChildren(node: UnknownJSXNode) {
  const childrenKey = possibleChildrenKeys.find((key) => isKey(node, key));
  return getSyncOrAsyncChildren(node, childrenKey);
}

export function getSyncOrAsyncChildren(node: UnknownJSXNode, key: Key): AsyncIterable<unknown> | Iterable<unknown> {
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

function getPropertiesRecord(
  node: UnknownJSXNode,
  key: Key
): Record<string | symbol, unknown> {
  if (!key) return {};
  const value = node[key];
  if (!isProperties(value)) return {};
  return value;
  function isProperties(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" || typeof value === "function";
  }
}

function getStringOrSymbol(node: UnknownJSXNode, key: Key) {
  const value = node[key];
  if (typeof value !== "string" && typeof value !== "symbol") return undefined;
  return value;
}

function isKey<K extends Key>(unknown: unknown, key: Key): key is K {
  ok<UnknownJSXNode>(unknown);
  const value = unknown[key];
  return typeof value !== "undefined" && value !== null;
}

export function isStaticChildNode(node: unknown): node is StaticChildNode {
  return (
    typeof node === "string" ||
    typeof node === "boolean" ||
    typeof node === "number"
  );
}

export function isNode<T extends UnknownJSXNode>(node: unknown): node is T {
  return isUnknownJSXNode(node);
}

export function isUnknownJSXNode(node: unknown): node is UnknownJSXNode {
  return typeof node === "object" || typeof node === "function";
}

export function assertUnknownJSXNode(
  node: unknown
): asserts node is UnknownJSXNode {
  ok(isUnknownJSXNode(node), "Expected Node");
}
