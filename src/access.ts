import { isAsyncIterable, isIterable } from "./is";
import { ok } from "./like";
import {Static} from "@virtualstate/examples";

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
export type FragmentName = ValuesOf<typeof possibleFragmentNamesSource>

export const possibleNameKeysKey = [
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

export type NameKey = ValuesOf<typeof possibleNameKeysKey> & {
  [NameKeySymbol]: true;
};
export type TagKey = ValuesOf<typeof possibleTagKeys> & {
  [TagKeySymbol]: true;
};
export type PropertiesKey = ValuesOf<typeof possiblePropertiesKeys> & {
  [PropertiesKeySymbol]: true;
};
export type ValuesKey = ValuesOf<typeof possibleValuesKeys> & {
  [ValuesKeySymbol]: true;
};
export type ChildrenKey = ValuesOf<typeof possibleChildrenKeys> & {
  [ChildrenKeySymbol]: true;
};

// interface InternalGenericNode
//   extends Record<NameKey, string | symbol>,
//       Record<TagKey, string>,
//       Record<ChildrenKey, Iterable<unknown> | AsyncIterable<unknown>>,
//       Record<ValuesKey, Iterable<StaticChildNode> | AsyncIterable<unknown>>,
//     Record<PropertiesKey, Record<string | symbol, unknown>> {}

interface GenericGetFn {
  (node: UnknownJSXNode): unknown;
}
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}
const GenericNodeFunctions = new Map<Key, GenericGetFn>([
  ...possibleNameKeysKey.map((key) => pair(key, getName)),
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

export interface FragmentNode extends UnknownJSXNode {

}

export function isFragment(
  node: unknown
): node is FragmentNode {
  if (!node) return false;
  if (!isUnknownJSXNode(node)) return false;
  return possibleFragmentNames.includes(getName(node));
}

export function get(key: string | symbol, node: UnknownJSXNode): unknown {
  const fn = GenericNodeFunctions.get(key);
  if (!fn) {
    return undefined;
  }
  return fn(node);
}

export function getName(node: UnknownJSXNode): string | symbol | undefined {
  const isNameKey = (key: Key): key is NameKey => {
    return isKey(node, key);
  };
  const nameKey: NameKey = possibleNameKeysKey.find(isNameKey);
  const value = node[nameKey];
  if (isUnknownJSXNode(value)) {
    return getName(value);
  }
  return getStringOrSymbol(node, nameKey);
}

export function getTag(node: UnknownJSXNode) {
  const isTagKey = (key: Key): key is TagKey => {
    return isKey(node, key);
  };
  const tagKey: TagKey = possibleTagKeys.find(isTagKey);
  return getStringOrSymbol(node, tagKey);
}

export function getProperties(node: UnknownJSXNode) {
  const isPropertiesKey = (key: Key): key is PropertiesKey => {
    return isKey(node, key);
  };
  const propertiesKey: PropertiesKey =
    possiblePropertiesKeys.find(isPropertiesKey);
  return getPropertiesRecord(node, propertiesKey);
}

export function getValues(node: UnknownJSXNode) {
  const isValuesKey = (key: Key): key is ValuesKey => {
    return isKey(node, key);
  };
  const valuesKey: ValuesKey = possibleValuesKeys.find(isValuesKey);
  const value = node[valuesKey];
  if (isIterable(value)) return value;
  return [];
}

export function getChildren(node: UnknownJSXNode) {
  const isChildrenKey = (key: Key): key is ChildrenKey => {
    return isKey(node, key);
  };
  const childrenKey: ChildrenKey = possibleChildrenKeys.find(isChildrenKey);
  return getSyncOrAsyncChildren(node, childrenKey);
}

export function getSyncOrAsyncChildren(node: UnknownJSXNode, key: ChildrenKey) {
  if (!key) return [];
  const value = node[key];
  if (Array.isArray(value)) return value;
  if (isIterable(value)) return value;
  if (isAsyncIterable(value)) return value;
  return [];
}

function getPropertiesRecord(
  node: UnknownJSXNode,
  key: PropertiesKey
): Record<string, unknown> {
  if (!key) return {};
  const value = node[key];
  if (!isProperties(value)) return {};
  return value;
  function isProperties(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" || typeof value === "function";
  }
}

function getStringOrSymbol(node: UnknownJSXNode, key: NameKey | TagKey) {
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
