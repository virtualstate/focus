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
import { UnknownJSXNode } from "./node";
import { isComponentFn } from "./like";
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
  const node = raw(input);
  const name = isComponentFn(node) ? node : node[getNameKey(node)];
  if (!isComponentFn(name)) return undefined;
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
      const result = name.call(that, properties(node), children);
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
      yield* resolve(name.call(that, properties(node), children));
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
