import {anAsyncThing, TheAsyncThing} from "@virtualstate/promise/the-thing";
import {isStaticChildNode, isUnknownJSXNode} from "./like";
import {children} from "./children";
import {UnknownJSXNode} from "./access";
import {union} from "@virtualstate/union";
import * as jsx from "./access";

export interface JSONOptions {
    type?: string;
    props?: string;
    children?: string;
}

export function toJSONValue(node: unknown, options?: JSONOptions): TheAsyncThing {
    return anAsyncThing(toJSONValueGenerator(node, options))
}

export async function *toJSONValueGenerator(node: unknown, options?: JSONOptions): AsyncIterable<unknown> {
  if (!isUnknownJSXNode(node)) return yield node;
  const object: UnknownJSXNode = {};
  const name = jsx.isFragment(node) ? undefined : jsx.name(node);
  const props = jsx.properties(node);
  if (name) {
      object[options?.type ?? "type"] = name;
  }
  if (Object.keys(props).length) {
      object[options?.props ?? "props"] = props;
  }
  let yielded = false;
  const cache = new Map<object, unknown>();
  let last;
  for await (const snapshot of children(node)) {
      for await (const values of union(snapshot.map(async function *(node) {
          if (!isUnknownJSXNode(node)) return yield node;
          const existing = cache.get(node);
          if (existing) {
              return yield existing;
          }
          for await (const value of toJSONValueGenerator(node, options)) {
              cache.set(node, value);
              yield value;
          }
      }))) {
          const current = values.filter(value => isStaticChildNode(value) || isUnknownJSXNode(value));
          if (last && last.length === current.length && last.every((value, index) => current[index] === value)) {
              continue;
          }
          yield {
              ...object,
              children: current
          };
          last = current;
          yielded = true;
      }
  }
  if (!yielded && name) yield object;
}

export function toJSON(node: unknown, options?: JSONOptions): TheAsyncThing<string> {
    return anAsyncThing(toJSONGenerator(node, options));
}

export async function *toJSONGenerator(node: unknown, options?: JSONOptions): AsyncIterable<string> {
    // let last = undefined;
    for await (const object of toJSONValueGenerator(node, options)) {
        const current = JSON.stringify(object);
        // We achieve the same instead in toJSONValueGenerator using direct comparison
        // This means we mainly only check primitives, but if object references are also equal, then that's cool too!
        // if (last === current) continue;
        yield current;
        // last = current;
    }
}