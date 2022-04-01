import {descendantsSettledGenerator} from "./children";
import {anAsyncThing, TheAsyncThing} from "@virtualstate/promise/the-thing";
import {name} from "./access";
import {isStaticChildNode, isUnknownJSXNode} from "./like";

export interface ToTreeOptions {

}

type TreeMap = Map<object, unknown[]>

export function toTree(node: unknown, options?: ToTreeOptions): TheAsyncThing<TreeMap>
export function toTree<T extends TreeMap>(node: unknown, options?: ToTreeOptions): TheAsyncThing<T>
export function toTree(node: unknown, options?: ToTreeOptions): TheAsyncThing<TreeMap> {
    return anAsyncThing(toTreeGenerator(node, options));
}

export function toTreeGenerator(node: unknown, options?: ToTreeOptions): AsyncIterable<TreeMap>
export function toTreeGenerator<M extends TreeMap>(node: unknown, options?: ToTreeOptions): AsyncIterable<M>
export async function *toTreeGenerator(node: unknown, options?: ToTreeOptions): AsyncIterable<TreeMap> {
    if (!isUnknownJSXNode(node)) return;
    for await (const snapshot of descendantsSettledGenerator(node, options)) {
        const nextMap = new Map()
        for (const status of snapshot) {
            if (!status) continue; // This can happen from a fragment that still is starting resolution
            if (status.status !== "fulfilled") throw status.reason;
            const { parent, value } = status;
            if (!value && !isStaticChildNode(value)) continue;
            const nodeName = name(node);
            if (!nodeName) continue;
            const existing = nextMap.get(parent);
            if (existing) {
                nextMap.set(parent, existing.concat([value]))
            } else {
                nextMap.set(parent, [value]);
            }
        }
        if (!nextMap.size) {
            nextMap.set(node, []);
        }
        yield nextMap;
    }
}