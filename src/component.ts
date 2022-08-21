import { createFragment } from "./static-h";
import { isAsyncIterable, isIterable } from "./is";
import {
  getChildrenFragmentFromRawNode,
  getChildrenFromRawNode,
  getNameKey,
  instance,
  properties,
  raw,
} from "./access";
import { UnknownJSXNode } from "./access";
import { ComponentFn, isComponentFn } from "./like";
import { aSyncThing } from "@virtualstate/promise/the-sync-thing";

export interface ComponentOptions {
  this?: unknown;
}

export type ComponentIterable =
  | (AsyncIterable<unknown> | Iterable<unknown>)
  | (AsyncIterable<unknown> & Iterable<unknown>);

export function component(
  input: UnknownJSXNode,
  options?: ComponentOptions
): ComponentIterable | undefined {
  function getName(input: unknown): ComponentFn {
    const node = raw(input);
    const name = isComponentFn(node) ? node : node[getNameKey(node)];
    if (!isComponentFn(name)) return undefined;
    return name;
  }
  if (isAsyncIterable(input)) return input;
  const node = raw(input);
  if (isAsyncIterable(node)) return node;
  const name = getName(input);
  if (!name) return undefined;
  const nodeInstance = instance(name);
  if (isAsyncIterable(nodeInstance)) {
    return nodeInstance;
  }
  if (isIterable(nodeInstance)) {
    return aSyncThing(nodeInstance);
  }
  const children = getChildrenFragmentFromRawNode(node);
  return {
    *[Symbol.iterator]() {
      if (nodeInstance && nodeInstance instanceof name) {
        return yield flatIterable(nodeInstance);
      }
      const that =
        typeof options?.this === "function"
          ? options.this(name, options)
          : options?.this;
      const nodeProperties = properties(node);
      const result = name.call(that, nodeProperties, children);
      yield* flatIterable(result);
    },
    async *[Symbol.asyncIterator]() {
      if (nodeInstance && nodeInstance instanceof name) {
        return yield* resolve(nodeInstance);
      }
      // treat it as a getter like function
      const that =
        typeof options?.this === "function"
          ? options.this(name, options)
          : options?.this;
      const nodeProperties = properties(node);
      yield* resolve(name.call(that, nodeProperties, children));
      async function* resolve(input: unknown): AsyncIterable<unknown> {
        if (isIterable(input)) {
          return yield* flatIterable(input);
        } else if (isAsyncIterable(input)) {
          return yield* input;
        }
        yield await input;
      }
    },
  };
}

function* flatIterable(input: unknown): Iterable<unknown> {
  if (isIterable(input)) {
    for (const value of input) {
      yield* flatIterable(value);
    }
  } else {
    yield input;
  }
}
