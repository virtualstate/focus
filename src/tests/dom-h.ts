import dom from "./dom-document";
import {
    isDescendantFulfilled,
    isKeyIn,
    isLike,
    proxy
} from "@virtualstate/focus";
import {descendantsSettled} from "@virtualstate/focus";
import {ok, isStaticChildNode} from "@virtualstate/focus";

const { document, HTMLElement } = dom;

export {
    document,
    HTMLElement
}

export function isNode(node: unknown): node is Node {
    return isLike<Node>(node) && typeof node.nodeType === "number";
}

export function createElement(tagName: string, options?: unknown, ...children: unknown[]): HTMLElement {
    let instance: HTMLElement;
    const proxied = proxy({
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
    ok<HTMLElement>(proxied);
    return proxied;
}

export function setOptions(element: HTMLElement, options: unknown) {
    setAttributes(element, options);
    for (const [key, value] of Object.entries(options ?? {})) {
        if (set(`${key}List`, value)) continue;
        if (key.endsWith("Name")) {
            const withoutName = key.replace(/Name$/, "");
            if (set(`${withoutName}List`, value)) continue;
        }
        set(key, value)
    }

    function isDOMTokenList(value: unknown): value is DOMTokenList  {
        return isLike<DOMTokenList>(value) && typeof value.add === "function";
    }

    function isArrayLike(value: unknown): value is unknown[] {
        return isKeyIn(value, "length");
    }

    function set(key: string | symbol, value: unknown) {
        if (!isKeyIn(element, key)) return false;
        if (typeof key === "string" && key.endsWith("List") && typeof value === "string") {
            value = value.split(/\s+/g).filter(Boolean)
        }
        if (isArrayLike(value)) {
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
        return true;
    }
}

export function setAttributes(element: HTMLElement, options: unknown) {
    const attributes = Object.entries(options ?? {})
        .filter(([key, value]) => typeof key === "string" && isStaticChildNode(value))
        .filter(([, value]) => value !== false)
        .map(([key, value]): [string, string] => [key, value === true ? "" : `${value}`]);
    for (const [key, value] of attributes) {
        element.setAttribute(key, value);
    }
}

export const h = createElement;

export async function appendChild(node: HTMLElement, parent: HTMLElement) {
    const appended = appendDescendants(node);
    await Promise.any([appended, new Promise<void>(queueMicrotask)]);
    if (node instanceof HTMLElement) {
        if (node.parentElement) {
            if (node.parentElement !== parent) {
                node.parentElement.removeChild(node);
                parent.appendChild(node)
            }
        } else {
            parent.appendChild(node);
        }
    }
    await appended;
}

export async function appendDescendants(node: unknown) {
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