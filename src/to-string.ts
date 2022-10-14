import {anAsyncThing, TheAsyncThing} from "@virtualstate/promise/the-thing";
import {JSONOptions} from "./to-json";
import {isStaticChildNode, isUnknownJSXNode} from "./like";
import {children} from "./children";
import {union} from "@virtualstate/union";
import {StaticChildNode} from "./access";
import * as jsx from "./access";

export interface StringOptions extends Omit<JSONOptions, "flat"> {

}

export function toString(
    node: unknown,
    options?: JSONOptions
): TheAsyncThing<string> {
  return anAsyncThing<string>({
    [Symbol.asyncIterator]() {
      return toStringGenerator(node, options)[Symbol.asyncIterator]()
    },
    then(resolve, reject) {
      return toStringPromise(node, options).then(resolve, reject)
    }
  })
}

async function* toStringChildrenGenerator(
    node: unknown,
    options?: StringOptions
): AsyncIterable<string> {
  if (!isUnknownJSXNode(node)) return;
  const cache = new WeakMap<object, StaticChildNode>();
  let last: unknown[];
  for await (const snapshot of children(node)) {
    for await (const values of union(
        snapshot.map(async function* (node): AsyncIterable<StaticChildNode> {
          if (!isUnknownJSXNode(node)) {
            if (isStaticChildNode(node)) yield String(node);
            return;
          }
          const existing = cache.get(node);
          if (existing) {
            return yield existing;
          }
          for await (const value of toStringGenerator(node, options)) {
            cache.set(node, value);
            yield value;
          }
        })
    )) {
      const current = values.filter(isStaticChildNode);
      if (
          last &&
          last.length === current.length &&
          last.every((value, index) => current[index] === value)
      ) {
        continue;
      }
      yield current.join("\n");
      last = current;
    }
  }
}

function isReplacerFn(value: unknown): value is (this: unknown, key: string, value: unknown) => unknown {
  return typeof value === "function";
}

export async function* toStringGenerator(
    node: unknown,
    options?: StringOptions
): AsyncIterable<string> {
  if (!isUnknownJSXNode(node)) {
    if (isStaticChildNode(node)) yield String(node);
    return;
  }
  if (jsx.isFragment(node)) {
    return yield * toStringChildrenGenerator(node, options);
  }
  let name = jsx.name(node);
  if (typeof name !== "string") {
    // Any symbol nodes are dropped
    return;
  }
  if (options?.toLowerCase) {
    name = name.toLowerCase();
  }
  const props = jsx.properties(node);
  let propsString = "";
  if (Object.keys(props).length) {
    function toPropString([key, value]: [string, unknown]) {
      if (value === false) {
        return undefined;
      }
      if (value === true) {
        return key;
      }
      return `${key}="${String(value)}"`;
    }
    const replacer = isReplacerFn(options?.replacer) ? options.replacer : undefined;
    function toReplacerString([key, value]: [string, unknown]) {
      const replaced = replacer.call(node, key, value);
      if (typeof replaced === "undefined") return undefined;
      if (replaced === true) return key;
      return `${key}="${String(replaced)}"`;
    }
    const propsEntries = Object.entries(props)
        .map(replacer ? toReplacerString : toPropString)
        .filter(Boolean)
        .join(" ");
    if (propsEntries.length) {
      propsString = ` ${propsEntries}`
    }
  }
  let yielded = false;
  for await (let snapshot of toStringChildrenGenerator(node, options)) {
    if (snapshot) {
      if (typeof options?.space === "string") {
        snapshot = snapshot
            .split("\n")
            .map(value => `${options.space}${String(value)}`)
            .join("\n")
      }
      yield `<${name}${propsString}>\n${snapshot}\n</${name}>`
    } else {
      yield `<${name}${propsString} />`;
    }
    yielded = true;
  }
  if (!yielded) {
    yield `<${name}${propsString} />`;
  }
}


async function toStringChildrenPromise(
    node: unknown,
    options?: StringOptions
): Promise<string> {
  if (!isUnknownJSXNode(node)) return undefined;
  const snapshot = await children(node);
  const values = await Promise.all(
      snapshot.map(node => toStringPromise(node, options))
  )
  return values
      .filter(isStaticChildNode)
      .join("\n");
}

async function toStringPromise(
    node: unknown,
    options?: StringOptions
): Promise<string> {
  if (!isUnknownJSXNode(node)) {
    if (isStaticChildNode(node)) return String(node);
    return undefined;
  }
  if (jsx.isFragment(node)) {
    return toStringChildrenPromise(node, options);
  }
  let name = jsx.name(node);
  if (typeof name !== "string") {
    // Any symbol nodes are dropped
    return undefined;
  }
  if (options?.toLowerCase) {
    name = name.toLowerCase();
  }
  const props = jsx.properties(node);
  let propsString = "";
  if (Object.keys(props).length) {
    function toPropString([key, value]: [string, unknown]) {
      if (value === false) {
        return undefined;
      }
      if (value === true) {
        return key;
      }
      return `${key}="${String(value)}"`;
    }
    const replacer = isReplacerFn(options?.replacer) ? options.replacer : undefined;
    function toReplacerString([key, value]: [string, unknown]) {
      const replaced = replacer.call(node, key, value);
      if (typeof replaced === "undefined") return undefined;
      if (replaced === true) return key;
      return `${key}="${String(replaced)}"`;
    }
    const propsEntries = Object.entries(props)
        .map(replacer ? toReplacerString : toPropString)
        .filter(Boolean)
        .join(" ");
    if (propsEntries.length) {
      propsString = ` ${propsEntries}`
    }
  }
  let snapshot = await toStringChildrenPromise(node, options);
  if (snapshot) {
    if (typeof options?.space === "string") {
      snapshot = snapshot
          .split("\n")
          .map(value => `${options.space}${String(value)}`)
          .join("\n")
    }
    return `<${name}${propsString}>\n${snapshot}\n</${name}>`
  } else {
    return `<${name}${propsString} />`;
  }
}


