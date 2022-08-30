import { anAsyncThing, TheAsyncThing } from "@virtualstate/promise/the-thing";
import { isStaticChildNode, isUnknownJSXNode } from "./like";
import { children } from "./children";
import { UnknownJSXNode } from "./access";
import { union } from "@virtualstate/union";
import * as jsx from "./access";
import flat from "./tests/flat";

export interface JSONOptions {
  type?: string;
  props?: string;
  children?: string;
  replacer?: Parameters<typeof JSON.stringify>[1];
  space?: Parameters<typeof JSON.stringify>[2];
  toLowerCase?: boolean;
  flat?: boolean;
}

export function toJSONValue(
  node: unknown,
  options?: JSONOptions
): TheAsyncThing {
  return anAsyncThing(toJSONValueGenerator(node, options));
}

async function* toJSONChildrenValueGenerator(
    node: unknown,
    options?: JSONOptions
) {
  if (!isUnknownJSXNode(node)) return;
  const cache = new WeakMap<object, unknown>();
  let last: unknown[];
  for await (const snapshot of children(node)) {
    for await (const values of union(
        snapshot.map(async function* (node): AsyncIterable<unknown> {
          if (!isUnknownJSXNode(node)) return yield node;
          const existing = cache.get(node);
          if (existing) {
            return yield existing;
          }
          for await (const value of toJSONValueGenerator(node, options)) {
            cache.set(node, value);
            yield value;
          }
        })
    )) {
      const current = values.filter(
          (value) => isStaticChildNode(value) || isUnknownJSXNode(value)
      );
      if (
          last &&
          last.length === current.length &&
          last.every((value, index) => current[index] === value)
      ) {
        continue;
      }
      if (
          options?.flat &&
          Array.isArray(current) &&
          current.length === 1 &&
          isStaticChildNode(current[0])
      ) {
        yield current[0];
      } else {
        yield current;
      }
      last = current;
    }
  }
}

export async function* toJSONValueGenerator(
  node: unknown,
  options?: JSONOptions
): AsyncIterable<unknown> {
  if (!isUnknownJSXNode(node)) return yield node;
  const object: UnknownJSXNode = {};
  const isFragment = jsx.isFragment(node);
  let name = isFragment ? "#fragment" : jsx.name(node);
  if (typeof name === "string" && options?.toLowerCase) {
    name = name.toLowerCase();
  }
  const props = jsx.properties(node);
  if (name) {
    if (options?.flat) {
      object[name] = [];
    } else {
      object[options?.type ?? "type"] = name;
    }
  }
  if (!isFragment && Object.keys(props).length) {
    object[options?.props ?? "props"] = props;
  }
  const childrenKey = options?.flat ? name : options?.children ?? "children";
  let yielded = false;
  for await (const snapshot of toJSONChildrenValueGenerator(node, options)) {
    yield {
      ...object,
      [childrenKey]: snapshot,
    };
    yielded = true;
  }
  if (!yielded && name && !isFragment) {
    yield object;
  }
}

export function toJSON(
  node: unknown,
  options?: JSONOptions
): TheAsyncThing<string> {
  return anAsyncThing(toJSONGenerator(node, options));
}

export async function* toJSONGenerator(
  node: unknown,
  options?: JSONOptions
): AsyncIterable<string> {
  // let last = undefined;
  for await (const object of toJSONValueGenerator(node, options)) {
    // set space to "" if you want to remove tabbing
    const current = JSON.stringify(
      object,
      options?.replacer,
      options?.space ?? "  "
    );
    // We achieve the same instead in toJSONValueGenerator using direct comparison
    // This means we mainly only check primitives, but if object references are also equal, then that's cool too!
    // if (last === current) continue;
    yield current;
    // last = current;
  }
}
