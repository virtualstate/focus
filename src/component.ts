import {createFragment} from "./static-h";
import {isAsyncIterable, isIterable} from "./is";
import {getChildren, getName, getNameKey, getProperties} from "./access";
import {UnknownJSXNode} from "./node";
import {isLike} from "./like";

interface ComponentFn {
    (options: Record<string | symbol, unknown>, input?: UnknownJSXNode): void;
}

export function component(node: UnknownJSXNode): AsyncIterable<unknown> {
    const name = node[getNameKey(node)];
    if (!isLike<ComponentFn>(name, typeof name === "function")) return undefined;
    const children = getChildren(node);
    return {
        async *[Symbol.asyncIterator]() {
            yield * resolve(name(getProperties(node), createFragment({}, children)));
            async function *resolve(input: unknown): AsyncIterable<unknown> {
                if (isIterable(input)) {
                    return yield input;
                } else if (isAsyncIterable(input)) {
                    return yield * input;
                }
                yield await input;
            }
        }
    }
}