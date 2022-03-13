import dom from "./dom-document";
import {
    get,
    getInstance,
    getName,
    isDescendantFulfilled,
    isFulfilled,
    isKeyIn,
    isLike,
    proxy
} from "@virtualstate/focus";
import {descendants, descendantsSettled} from "@virtualstate/focus";
import {ok, isStaticChildNode} from "@virtualstate/focus";

const { document, Node, HTMLElement } = dom;

function isNode(node: unknown): node is Node {
    return isLike<Node>(node) && typeof node.nodeType === "number";
}

function isTextNode(node: unknown): node is Node & { nodeType: typeof Node.TEXT_NODE } {
    return isNode(node) && node.nodeType === Node.TEXT_NODE;
}

function createElement(tagName: string, options?: unknown, ...children: unknown[]) {
  let instance: HTMLElement;
  return proxy({
    tagName,
    options,
    get instance() {
      if (instance) return instance;

      instance = document.createElement(tagName, options);
    setOptions(instance, options);
      return instance;
    },
    children
  });
}

function setOptions(element: HTMLElement, options: unknown) {
    setAttributes(element, options);
    for (const [key, value] of Object.entries(options ?? {})) {
        if (!isKeyIn(element, key)) continue;

        if (isKeyIn(value, "length")) {
            // const add = Array.isArray(element[key]) ?
            //     ((target: unknown[]) => (value: unknown) => target.push(value))(element[key]) :
            // Object.assign(element[key], { length: value.length }, { ...value });
            const elementValue: unknown = element[key];
            const list: DOMTokenList = isDOMTokenList(elementValue) ? elementValue : undefined;
            const array = !list && Array.isArray(elementValue) ? elementValue : undefined;

            const items = Array.from(value);
            if (list) {
                const strings = items.map(item => `${item}`);
                for (const existing of Array.from(list)) {
                    if (!strings.includes(existing)) {
                        list.remove(existing);
                    }
                }
                for (const string of strings) {
                    if (!list.contains(string)) {
                        list.add(string)
                    }
                }
            } else if (array) {
                for (const existing of array) {
                    if (items.includes(existing)) continue;
                    const index = array.indexOf(existing);
                    if (index === -1) continue;
                    array.splice(index, 1);
                }
                for (const item of items) {
                    if (!array.includes(item)) {
                        array.push(item);
                    }
                }
            }
        } else {
            element[key] = value;
        }

    }

    function isDOMTokenList(value: unknown): value is DOMTokenList  {
        return isLike<DOMTokenList>(value) && typeof value.add === "function";
    }
}

function setAttributes(element: HTMLElement, options: unknown) {
    const attributes = Object.entries(options ?? {})
        .filter(([key, value]) => typeof key === "string" && isStaticChildNode(value))
        .filter(([, value]) => value !== false)
        .map(([key, value]): [string, string] => [key, value === true ? "" : `${value}`]);
    for (const [key, value] of attributes) {
        element.setAttribute(key, value);
    }
}

const h = createElement;

const value = Math.random();

const div: HTMLElement = <div><input value={1} type="number" /><section id="section" classList={["a", "b"]}>{value}</section></div>

console.log({ div, instance: div instanceof HTMLElement });

const expectedId = `${Math.random()}`

div.id = expectedId;
div.setAttribute("id", expectedId);

console.log({ id: div.getAttribute("id"), [expectedId]: div.getAttribute(expectedId) });

ok(div.getAttribute("id") === expectedId || div.getAttribute(expectedId) === expectedId);

console.log({ descendants: await descendants(div) });
ok((await descendants(div)).includes(value));

console.log({ descendantsSettled: await descendantsSettled(div) });
ok((await descendantsSettled(div)).map(status => status.status === "fulfilled" ? status.value : undefined).includes(value));

async function mount(node: unknown) {
  for await (const descendants of descendantsSettled(node)) {
    const parents = descendants
        .filter(isDescendantFulfilled)
        .reduce((map, { value, parent }) => {
          let array = map.get(parent);
          if (!array) {
            array = [];
            map.set(parent, array);
          }
          array.push(value);
          return map;
        }, new Map<unknown, unknown[]>());
    for (const parent of parents.keys()) {
      if (!isNode(parent)) continue;
      const descendants = parents.get(parent);
      const nodes = descendants
          .map(node => {
            if (isStaticChildNode(node)) {
              return document.createTextNode(`${node}`);
            } else if (node instanceof HTMLElement) {
              return proxy(node).instance ?? node;
            } else {
                return undefined;
            }
          });
      const childNodes = parent.childNodes;
      const reverseNodes = [...nodes].reverse();
      const maxChildNodes = Math.max(nodes.length, childNodes.length);
      for (let index = 0; index < maxChildNodes; index += 1) {
          const expected = nodes[index];
          const current = childNodes[index];
          const previous = reverseNodes.find((node, nodeIndex) => !!node && nodeIndex < index);
          if (expected === current) continue;
          if (current) {
              parent.removeChild(current);
          }
          if (isNode(previous) && isNode(expected)) {
            if (previous.nextSibling) {
                parent.insertBefore(expected, previous.nextSibling)
            } else {
                parent.appendChild(expected);
            }
          } else {
              if (childNodes.length) {
                  for (const node of Array.from(childNodes)) {
                      parent.removeChild(node);
                  }
              }
              if (isNode(expected)) {
                  parent.appendChild(expected);
              }
          }
      }
    }
  }
}

await mount(div);


console.log({ descendants: await descendants(div) });

const d = await descendants(div);
const section = d.find(node => getName(node) === "section");

console.dir({ section, ...(section instanceof HTMLElement ? { classList: section.classList, className: section.className } : undefined) });