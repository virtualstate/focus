import { createFragment } from "./static-h";
import { isAsyncIterable, isIterable } from "./is";
import {getChildrenFragmentFromRawNode, getChildrenFromRawNode, getNameKey, instance, properties, raw} from "./access";
import { UnknownJSXNode } from "./node";
import {isComponentFn} from "./like";

export interface ComponentOptions {
  this?: unknown;
}

export function component(
  input: UnknownJSXNode,
  options?: ComponentOptions
): AsyncIterable<unknown> | undefined {
  const node = raw(input);
  const name = isComponentFn(node) ? node : node[getNameKey(node)];
  if (!isComponentFn(name)) return undefined;
  const nodeInstance = instance(name);
  if (isAsyncIterable(nodeInstance)) {
    return nodeInstance;
  }
  const children = getChildrenFragmentFromRawNode(node);
  return {
    async *[Symbol.asyncIterator]() {
      if (nodeInstance && nodeInstance instanceof name) {
        return yield* resolve(children);
      }
      // treat it as a getter like function
      const that =
        typeof options?.this === "function"
          ? options.this(name, options)
          : options?.this;
      yield* resolve(
        name.call(
          that,
          properties(node),
          children
        )
      );
      async function* resolve(input: unknown): AsyncIterable<unknown> {
        if (isIterable(input)) {
          return yield input;
        } else if (isAsyncIterable(input)) {
          return yield* input;
        }
        yield await input;
      }
    },
  };
}
