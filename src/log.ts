import {DescendantPromiseSettledResult} from "./children";
import {isDescendantFulfilled} from "./like";
import {isFragment, name, properties} from "./access";

export function logDescendantPromiseSettledResult(...states: DescendantPromiseSettledResult[]) {
    for (const state of states) {
        const { parent } = state;
        const log: unknown[] = toLogArray(parent);
        if (isDescendantFulfilled(state)) {
            const { value } = state;
            log.push(...toLogArray(value));
        } else {
            const { reason } = state;
            log.push(reason);
        }
        console.log(...log);

        function toLogArray(node: unknown): unknown[] {
            if (isFragment(node)) {
                return ["fragment"];
            }
            return [
                name(node),
                properties(node)
            ]
        }
    }
}