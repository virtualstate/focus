import { createFragment } from "./static-h";
import { isAsyncIterable, isIterable } from "./is";
import { getChildrenFromRawNode, getNameKey, properties, raw } from "./access";
import { UnknownJSXNode } from "./node";
import { isLike, isUnknownJSXNode } from "./like";

interface ComponentFn {
  (options: Record<string | symbol, unknown>, input?: UnknownJSXNode): void;
}

export function isComponentFn(node: unknown): node is ComponentFn {
  return isLike(node, typeof node === "function");
}

export function isComponentNode(input: unknown): boolean {
  if (!isUnknownJSXNode(input)) return false;
  const node = raw(input);
  if (isComponentFn(node)) return true;
  const name = node[getNameKey(node)];
  return isComponentFn(name);
}

export function component(
  input: UnknownJSXNode
): AsyncIterable<unknown> | undefined {
  const node = raw(input);
  const name = isComponentFn(node) ? node : node[getNameKey(node)];
  if (!isComponentFn(name)) return undefined;
  const children = getChildrenFromRawNode(node);
  return {
    async *[Symbol.asyncIterator]() {
      yield* resolve(name(properties(node), createFragment({}, children)));
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
