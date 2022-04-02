import {anAsyncThing, TheAsyncThing} from "@virtualstate/promise/the-thing";
import {isUnknownJSXNode} from "./like";
import {children} from "./children";
import {UnknownJSXNode} from "./access";
import {union} from "@virtualstate/union";
import * as jsx from "./access";

export interface JSONOptions {
    name?: string;
    properties?: string;
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
      object[options?.name ?? "name"] = name;
  }
  if (Object.keys(props).length) {
      object[options?.properties ?? "properties"] = props;
  }
  let yielded = false;
  const cache = new Map<object, unknown>();
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
          yield {
              ...object,
              children: values
          };
          yielded = true;
      }
  }
  if (!yielded && name) yield object;
}

export function toJSON(node: unknown, options?: JSONOptions): TheAsyncThing<string> {
    return anAsyncThing(toJSONGenerator(node, options));
}

export async function *toJSONGenerator(node: unknown, options?: JSONOptions): AsyncIterable<string> {
    for await (const object of toJSONValueGenerator(node, options)) {
        yield JSON.stringify(object)
    }
}