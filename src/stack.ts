import {
  isFragment,
  toGenericNode,
  UnknownJSXNode,
} from "./node";
import { isAsyncIterable, isIterable } from "./is";
import { anAsyncThing } from "@virtualstate/promise/the-thing";
import {isUnknownJSXNode} from "./like";

export async function stack(input: UnknownJSXNode): Promise<unknown[]> {
  const node = toGenericNode(input);
  const defaultStack: unknown[] = [];
  if (!isFragment(node) && node.name) {
    defaultStack.push({
      name: node.name,
      props: node.props,
      children: node.children,
    });
  }
  const children: unknown = node.children;

  let iterable: Iterable<unknown>;
  if (isIterable(children)) {
    iterable = children;
  } else if (isAsyncIterable(children)) {
    const result = await anAsyncThing(children);
    if (isIterable(result)) {
      iterable = result;
    } else {
      iterable = [result];
    }
  }
  if (!iterable) {
    return defaultStack;
  }
  const snapshot = [...iterable];
  if (!snapshot.length) {
    return defaultStack;
  }
  const stacks = await Promise.all(
    snapshot.map(async (child): Promise<unknown[]> => {
      if (isUnknownJSXNode(child)) {
        return stack(child);
      } else if (isIterable(child) || isAsyncIterable(child)) {
        return stack(toGenericNode(child));
      } else {
        return [child];
      }
    })
  );
  return stacks.reduce((concat, stack) => concat.concat(stack), defaultStack);
}
