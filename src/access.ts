import { isAsyncIterable, isIterable } from "./is";
import {
  assertUnknownJSXNode,
  isComponentFn,
  isComponentNode,
  isKey,
  isKeyIn,
  isLike,
  isPromise,
  isStaticChildNode,
  isUnknownJSXNode,
  ok,
  isSymbol
} from "./like";
import { createFragment } from "./static-h";

const FunctionToString = Function.prototype.toString;

export type Key = string | symbol;
export type UnknownJSXNodeRecord = Record<Key, unknown>;
export type UnknownJSXNode = UnknownJSXNodeRecord;

const possibleFragmentResultNames = [
  Symbol.for(":jsx/fragment/result"),
  Symbol.for(":jsx/result"),
];

export const possibleValueChildrenKeysStrings = [
  "textContent",
  "text",
  "data",
  "value",
  "nodeValue",
] as const;
const possibleFragmentNames = [
  Symbol.for(":jsx/fragment"),
  Symbol.for(":kdl/fragment"),
  Symbol.for("@virtualstate/fringe/fragment"),
  Symbol.for("@virtualstate/focus/fragment"),
  "Fragment",
  "fragment",
] as const;
export type FragmentName = typeof possibleFragmentNames[number];

export const possibleNameKeysStrings = [
  "tagName",
  "nodeName",
  "source",
  "type",
  "$$type",
  "reference",
  "url",
  "id",
  "node",
  "name",
] as const;
export const possibleNameKeys = [
  Symbol.for(":kdl/name"),
  Symbol.for(":jsx/name"),
  Symbol.for(":jsx/type"),
  Symbol.for("@virtualstate/fringe/source"),
  Symbol.for("@virtualstate/focus/source"),
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
  "attribs",
  "fields",
  "headers",
] as const;
export const possiblePropertiesKeys = [
  Symbol.for(":kdl/properties"),
  Symbol.for(":kdl/props"),
  Symbol.for(":jsx/props"),
  Symbol.for(":jsx/properties"),
  Symbol.for(":jsx/options"),
  Symbol.for("@virtualstate/fringe/options"),
  Symbol.for("@virtualstate/focus/options"),
  ...possiblePropertiesKeysStrings,
] as const;
export const possibleValuesKeysStrings = ["values"] as const;
export const possibleValuesKeys = [
  Symbol.for(":kdl/values"),
  Symbol.for(":jsx/values"),
  ...possibleValuesKeysStrings,
] as const;
export const possibleChildrenKeysStrings = [
  "childNodes",
  "children",
  "_children",
  ...possibleValueChildrenKeysStrings,
] as const;
export const possibleChildrenKeys = [
  Symbol.for(":kdl/children"),
  Symbol.for(":jsx/children"),
  Symbol.for("@virtualstate/fringe/children"),
  Symbol.for("@virtualstate/focus/children"),
  ...possibleChildrenKeysStrings,
] as const;
export const possiblePropertiesChildrenKeysStrings = [
  "childNodes",
  "children",
  "_children",
] as const;
export const possiblePropertiesChildrenKeys = [
  Symbol.for(":kdl/children"),
  Symbol.for(":jsx/children"),
  Symbol.for("@virtualstate/fringe/children"),
  Symbol.for("@virtualstate/focus/children"),
  ...possiblePropertiesChildrenKeysStrings,
];

export const possibleInstanceKeysStrings = [
  "instance",
  "sourceInstance",
  "typeInstance",
  "$$typeInstance",
  "referenceInstance",
  "nameInstance",
] as const;
const Instance = Symbol.for("@virtualstate/focus/instance");
export const possibleInstanceKeys = [
  Symbol.for(":kdl/instance"),
  Symbol.for(":jsx/instance"),
  Symbol.for("@virtualstate/fringe/instance"),
  Symbol.for("@virtualstate/fringe/SourceInstance"),
  Instance,
  Symbol.for("@virtualstate/focus/SourceInstance"),
  ...possibleInstanceKeysStrings,
] as const;
const Raw = Symbol.for("@virtualstate/focus/tools/raw");
export const possibleRawKeys = [
  Symbol.for(":kdl/raw"),
  Symbol.for(":jsx/raw"),
  Symbol.for("@virtualstate/fringe/raw"),
  Symbol.for("@virtualstate/fringe/tools/raw"),
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
  (node: UnknownJSXNode, context?: unknown, instance?: unknown): unknown;
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
const allPossibleKeys = Object.keys(GenericNodeFunctions);

export type StaticChildNode = string | number | boolean;

export function isFragmentResult(node: unknown): boolean {
  if (!isFragment(node)) return false;
  if (!isUnknownJSXNode(node)) return false;
  const symbol = getFragmentSymbolKey(node);
  const value = node[symbol];
  if (value === true) return false; // Regular fragment
  const lookup: unknown[] = possibleFragmentResultNames;
  return lookup.includes(value);
}

function getFragmentKeys(): Key[] {
  return [
    ...possibleFragmentNames,
    ...possibleValueChildrenKeysStrings,
  ];
}

function getFragmentSymbolKey(node: UnknownJSXNode, keys = getFragmentKeys()) {
  const symbols = keys.filter<symbol>(isSymbol);
  return symbols.find((value) => {
    return !!node[value];
  });
}

export function isFragment(node: unknown): boolean {
  if (!node) return false;
  if (!isUnknownJSXNode(node)) return false;
  if (isComponentNode(node)) return true;
  if (isAsyncIterable(node)) return true;
  if (isIterable(node)) return true;
  if (isPromise(node)) return true;
  const rawNode = raw(node);
  if (isAsyncIterable(rawNode)) return true;
  if (isIterable(rawNode)) return true;
  if (isPromise(rawNode)) return true;
  const keys = getFragmentKeys();
  const found = name(node);
  const matchingName = keys.find((value) => {
    if (found === value) return true;
    if (typeof value !== "string") return false;
    if (typeof found !== "string") return false;
    return found.startsWith("#") && found.endsWith(value);
  });
  if (matchingName) {
    return true;
  }
  if (getFragmentSymbolKey(node, keys)) {
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
  const handler: ProxyHandler<object> = {
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
      if (p === Instance && (nodeInstance || isStaticChildNode(nodeInstance))) {
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
      return get(p, node, getters, context, nodeInstance);
    },
    set(target, p, value): boolean {
      if (isUnknownJSXNode(nodeInstance)) {
        nodeInstance[p] = value;
      }
      return true;
    },
  };
  const target = new Proxy(source, handler);
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
  context?: unknown,
  instance?: unknown
): unknown {
  assertUnknownJSXNode(node);
  const fn = getters?.[key] ?? GenericNodeFunctions[key];
  if (!fn) {
    return undefined;
  }
  return fn(node, context, instance);
}

export function name(node: UnknownJSXNode): string | symbol | undefined;
export function name(node: unknown): string | symbol | undefined;
export function name(node: UnknownJSXNode): string | symbol | undefined {
  if (typeof node === "string" || typeof node === "symbol") {
    return node;
  }
  if (isStaticChildNode(node)) {
    return String(node);
  }
  const [maybeNode, nameKey] = getNameAndKeyFromRawNode(node);
  if (!nameKey) {
    const flatKey = getFlatNodeKey(node);
    if (flatKey) {
      return flatKey;
    }
  }
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
  if (isUnknownJSXNode(maybeNode) && maybeNode !== node) {
    maybeNodeProperties = properties(maybeNode);
  }
  const propertiesKey = possiblePropertiesKeys.find((key) => isKey(node, key));
  const record = getPropertiesRecord(node, propertiesKey);
  if (!maybeNodeProperties) return record;
  return {
    ...maybeNodeProperties,
    ...record,
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
export function getChildrenFromRawNode(
  node: unknown,
  options?: unknown,
  instance?: unknown
): unknown {
  // if (isUnknownJSXNode(instance)) {
  //   if (isAsyncIterable(instance) || isIterable(instance)) {
  //     return instance;
  //   }
  // }
  if (!isUnknownJSXNode(node)) return [];
  const { value, children } = getValueOrChildrenFromRawNode(node);
  if (value || isStaticChildNode(value)) return value;
  return children;
}

function getChildrenValueKey(node: UnknownJSXNode) {
  return getKey(node, possibleValueChildrenKeysStrings);
}

function getChildrenKey(
  node: UnknownJSXNode,
  keys: readonly Key[] = possibleChildrenKeys
) {
  return getKey(node, keys);
}

function getKey(
  node: UnknownJSXNode,
  keys: readonly Key[] = possibleChildrenKeys
) {
  return keys.find((key) => isKey(node, key));
}

/**
 * @internal
 */
export function getValueOrChildrenFromRawNode(node: UnknownJSXNode): {
  value?: unknown;
  children?: unknown;
} {
  const children = getInternalChildrenFromRawNode(node);
  const isMaybeValueKey = getChildrenValueKey(node);
  if (!isMaybeValueKey) return { children };
  const value = getInternalChildrenFromRawNode(node, [isMaybeValueKey]);
  if (isStaticChildNode(value)) {
    if (children === value || (!children && value)) {
      return { value };
    }
    if (
      isLike<{ length: number; [0]: unknown }>(children) &&
      children.length === 0
    ) {
      return { value };
    }
  }
  return { children };
}

function isFragmentValue(node: UnknownJSXNode) {
  const { value } = getValueOrChildrenFromRawNode(node);
  return !!(value || isStaticChildNode(value));
}

function isChildren(node: UnknownJSXNode) {
  const { children } = getValueOrChildrenFromRawNode(node);
  return !!(children || isStaticChildNode(children));
}

const promiseChildrenCache = new WeakMap<
  Promise<unknown>,
  AsyncIterable<unknown>
>();

/**
 * @internal
 */
function getInternalChildrenFromRawNode(
  node: UnknownJSXNode,
  keys: Key[] | readonly Key[] = possibleChildrenKeys
): unknown {
  const [maybeNode] = getNameAndKeyFromRawNode(node);
  let maybeNodeChildren = undefined;
  if (isUnknownJSXNode(maybeNode)) {
    maybeNodeChildren = getInternalChildrenFromRawNode(maybeNode, keys);
  }

  if (isAsyncIterable(node)) return node;
  if (isPromise(node)) {
    const existing = promiseChildrenCache.get(node);
    if (existing) {
      return existing;
    }
    const promiseIterable = {
      async *[Symbol.asyncIterator]() {
        yield await node;
      },
    };
    promiseChildrenCache.set(node, promiseIterable);
    return promiseIterable;
  }
  if (isIterable(node)) return node;

  const resolvedKeys: Key[] | readonly Key[] = Array.isArray(keys)
    ? keys
    : possibleChildrenKeys;
  const maybePropertiesNode = properties(node);
  const childrenKey = getKey(node, resolvedKeys);
  const propertiesChildrenKey = getKey(
    maybePropertiesNode,
    resolvedKeys.filter((key) =>
      includesKey(key, possiblePropertiesChildrenKeys)
    )
  );
  let children;
  if (propertiesChildrenKey) {
    children = getSyncOrAsyncChildren(
      maybePropertiesNode,
      propertiesChildrenKey
    );
  } else if (childrenKey) {
    children = getSyncOrAsyncChildren(node, childrenKey);
  } else {
    const flatKey = getFlatNodeKey(node);
    if (!flatKey) {
      return [];
    }
    children = getSyncOrAsyncChildren(node, flatKey);
  }
  if (!maybeNodeChildren) {
    return children ?? [];
  }
  if (!children) {
    return maybeNodeChildren ?? [];
  }
  if (!Array.isArray(children)) {
    return children;
  }
  if (children.length) {
    return children;
  }
  if (Array.isArray(maybeNodeChildren) && !maybeNodeChildren.length) {
    return children;
  }
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
    if (isUnknownJSXNode(value)) return [value];
    return undefined;
  }

  function indexed(value: Indexed) {
    return {
      *[Symbol.iterator]() {
        yield* Array.from(value);
      },
    };
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
    const entries = Array.from(value).map((node) => [
      name(node),
      getChildrenFromRawNode(node),
    ]);
    return Object.fromEntries(entries);
  }
}

function getStringOrSymbol(node: UnknownJSXNode, key: Key) {
  const value = node?.[key];
  if (typeof value !== "string" && typeof value !== "symbol") return undefined;
  return value;
}

export function getChildrenFragmentFromRawNode(node: UnknownJSXNode) {
  const children = getChildrenFromRawNode(node);
  return createFragment(
    {},
    ...(Array.isArray(children) ? children : [children])
  );
}

export interface InstanceOptions {
  properties?: PropertiesRecord;
  children?: unknown;
}

export function instance(
  node: UnknownJSXNode,
  options?: InstanceOptions,
  existingInstance?: unknown
): unknown;
export function instance(
  node: unknown,
  options?: InstanceOptions,
  existingInstance?: unknown
): unknown;
export function instance(
  node: UnknownJSXNode,
  options?: InstanceOptions,
  existingInstance?: unknown
): unknown {
  if (existingInstance) {
    // delete this next line and a new instance will be constructed each time ;)
    return existingInstance;
  }
  const instanceKey = getKey(node, possibleInstanceKeys);
  if (instanceKey) {
    return node?.[instanceKey];
  }
  const MaybeClass = isComponentFn(node) ? node : node[getNameKey(node)];
  if (!isComponentFn(MaybeClass)) {
    if (isUnknownJSXNode(MaybeClass)) {
      const rawNode = raw(MaybeClass);
      if (rawNode === node) {
        return undefined;
      }
      return instance(rawNode, {
        properties: buildProperties(),
        children: buildChildren(),
      });
    }
    return undefined;
  }
  const string = FunctionToString.call(MaybeClass);
  if (!string.startsWith("class ")) return undefined;
  try {
    return new MaybeClass(buildProperties(), buildChildren());
  } catch {
    return undefined;
  }

  function buildChildren(): UnknownJSXNode {
    if (isUnknownJSXNode(options)) {
      const childrenKey = getChildrenKey(options);
      if (childrenKey) {
        const maybe = isUnknownJSXNode(options[childrenKey]);
        if (isUnknownJSXNode(maybe)) {
          return maybe;
        }
      }
    }
    return getChildrenFragmentFromRawNode(node);
  }

  function buildProperties() {
    return {
      ...properties(node),
      ...properties(options ?? {}),
    };
  }
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

function getFlatNodeKey(node: UnknownJSXNode): Key {
  if (!node) return undefined;
  const keys = Object.keys(node);
  if (!keys.length) return undefined;
  if (keys.length === 1) return keys[0];
  const possible = keys.filter((key) => !isPossibleKey(key, possibleNameKeys));
  return possible.length === 1 ? possible[0] : undefined;

  function isPossibleKey(key: Key, excluding: readonly Key[] = []) {
    return !!allPossibleKeys.find(
      (possible) => !excluding.includes(possible) && key === possible
    );
  }
}

export function isFlatNode(node: unknown): boolean {
  if (!isUnknownJSXNode(node)) return false;
  return !!getFlatNodeKey(node);
}
