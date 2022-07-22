import { descendants } from "./children";
import { anAsyncThing, TheAsyncThing } from "@virtualstate/promise/the-thing";
import { name } from "./access";
import { isStaticChildNode, isUnknownJSXNode, ok } from "./like";
import { isFragment } from "./access";

type GeneratorFunction = (
  node: unknown,
  options?: object
) => AsyncIterable<unknown[]>;

export interface ToMapOptions {
  get?: GeneratorFunction;
  array?: boolean;
  is?(name: Name, node: unknown): boolean;
}

type Name = string | symbol;
type NameMap<T = unknown> = Map<Name, T>;

export function toMap(
  node: unknown,
  options: ToMapOptions & { array: true }
): TheAsyncThing<NameMap<unknown[]>>;
export function toMap(
  node: unknown,
  options?: ToMapOptions
): TheAsyncThing<NameMap>;
export function toMap<M extends NameMap>(
  node: unknown,
  options?: ToMapOptions
): TheAsyncThing<M>;
export function toMap(
  node: unknown,
  options?: ToMapOptions
): TheAsyncThing<NameMap> {
  return anAsyncThing(toMapGenerator(node, options));
}

export function toMapGenerator(
  node: unknown,
  options: ToMapOptions & { array: true }
): AsyncIterable<NameMap<unknown[]>>;
export function toMapGenerator(
  node: unknown,
  options?: ToMapOptions
): AsyncIterable<NameMap>;
export function toMapGenerator<M extends NameMap>(
  node: unknown,
  options?: ToMapOptions
): AsyncIterable<M>;
export async function* toMapGenerator(
  node: unknown,
  options?: ToMapOptions
): AsyncIterable<NameMap> {
  const fn: GeneratorFunction = options?.get ?? descendants;
  for await (const snapshot of fn(node, options)) {
    const nextMap = new Map();
    for (const node of snapshot) {
      if (!isUnknownJSXNode(node)) continue;
      ok(!isFragment(node));
      const nodeName = name(node);
      if (!nodeName) continue;
      if (options?.is && !options.is(nodeName, node)) continue;
      if (options?.array) {
        const existing = nextMap.get(nodeName);
        if (Array.isArray(existing)) {
          nextMap.set(nodeName, existing.concat([node]));
        } else {
          nextMap.set(nodeName, [node]);
        }
      } else {
        nextMap.set(nodeName, node);
      }
    }
    yield nextMap;
  }
}
