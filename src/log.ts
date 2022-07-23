import {DescendantPromiseSettledResult, descendantsSettled} from "./children";
import {isDescendantFulfilled} from "./like";
import {isFragment, name, properties} from "./access";


export async function logDescendantsSettled(node: unknown) {
    return logDescendantsSettledIterable(descendantsSettled(node));
}

export async function logDescendantsSettledIterable(iterable: AsyncIterable<DescendantPromiseSettledResult[]>) {
    for await (const states of iterable) {
        logDescendantPromiseSettledResult(...states);
    }
}

export async function logDescendantsSettledPromise(promise: Promise<DescendantPromiseSettledResult[]>) {
    const states = await promise;
    logDescendantPromiseSettledResult(...states);
}

export function logDescendantPromiseSettledResult(...states: DescendantPromiseSettledResult[]) {

    function toNodeLogArray(node: unknown): unknown[] {
        if (isFragment(node)) {
            return ["fragment"];
        }
        return [
            name(node),
            properties(node)
        ]
    }


    function toDescendantNodeArray(state: DescendantPromiseSettledResult): unknown[] {
        if (isDescendantFulfilled(state)) {
            const { value } = state;
            return toNodeLogArray(value);
        } else {
            const { reason } = state;
            return [reason];
        }
    }

    const parents = new Map(
        states.reduce(
            (array: [unknown, DescendantPromiseSettledResult[]][], state) => {
                const found = array.find(([key]) => key === state.parent);
                if (!found) {
                    return [...array, [state.parent, [state]]];
                }
                found[1].push(state);
                return array;
            },
            []
        )
    );

    const logged = new Set();

    for (const state of states) {
        if (logged.has(state)) {
            // It may have been logged earlier if there is a shared parent
            continue;
        }
        const { parent } = state;
        const children = parents.get(parent);
        let head = toNodeLogArray(parent);
        if (children.length > 1) {
            console.log(...head);
            head = [];
        }
        for (const state of children) {
            logged.add(state);
            console.log(...head, ">", ...toDescendantNodeArray(state));
        }
    }
}