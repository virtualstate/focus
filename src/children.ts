import {isUnknownJSXNode, UnknownJSXNode} from "./node";
import {getChildren, isFragment, isProxyContextOptions, isStaticChildNode} from "./access";
import {isArray, isAsyncIterable, isIterable} from "./is";
import {union} from "@virtualstate/union";
import {anAsyncThing} from "@virtualstate/promise/the-thing";

export const ThrowAtEnd = Symbol.for("@virtualstate/focus/access/throwAtEnd")

export interface ChildrenOptions {
    [ThrowAtEnd]?: boolean
}

export function children(node: unknown, options?: ChildrenOptions) {
    return anAsyncThing(childrenGenerator(node, options));
}

export async function * childrenGenerator(node: unknown, options?: ChildrenOptions) {
    let rejected: PromiseRejectedResult[];
    for await (const snapshot of childrenSettledGenerator(node, options)) {
        rejected = snapshot.filter(isRejected);
        const resolvedSnapshot = snapshot.map(value => isFulfilled(value) ? value.value : undefined);
        if (!options?.[ThrowAtEnd]) {
            await throwIfRejected(rejected);
        }
        yield resolvedSnapshot;
    }
    await throwIfRejected(rejected);
}

async function throwIfRejected(rejected: PromiseRejectedResult[]) {
    if (!rejected?.length) return;
    const reasons = [...new Set(rejected.map(({ reason }) => reason))];
    if (reasons.length === 1) {
        throw await Promise.reject(reasons[0]);
    } else {
        throw new AggregateError(reasons);
    }
}

function isRejected(value: PromiseSettledResult<unknown>): value is PromiseRejectedResult {
    return value.status === "rejected";
}

function isFulfilled(value: PromiseSettledResult<unknown>): value is PromiseFulfilledResult<unknown> {
    return value.status === "fulfilled";
}

export function childrenSettled(node: unknown, options?: ChildrenOptions) {
    return anAsyncThing(childrenSettledGenerator(node, options));
}

export async function *childrenSettledGenerator(node: unknown, options?: ChildrenOptions): AsyncIterable<PromiseSettledResult<unknown>[]> {
    let knownLength = 0;
    try {
        for await (const snapshot of childrenSettledGeneratorInner()) {
            knownLength = snapshot.length;
            yield snapshot;
        }
    } catch (reason) {
        const rejected = { reason, status: "rejected" } as const;
        yield knownLength ? Array.from({ length: knownLength }, () => rejected) : [rejected];
    }

    async function *childrenSettledGeneratorInner() {
        if (!isUnknownJSXNode(node)) return;

        const input = getChildren(node);
        if (isIterable(input)) {
            yield * yieldSnapshot(input);
        } else if (isAsyncIterable(input)) {
            for await (const next of input) {
                yield * yieldSnapshot(next);
            }
        }
    }

    async function *yieldSnapshot(input: unknown): AsyncIterable<PromiseSettledResult<unknown>[]> {
        const proxyContextOptions = isProxyContextOptions(options) ? options : undefined;
        const snapshot = flat(input).map(value => {
            if (!proxyContextOptions) return value;
            if (!isUnknownJSXNode(value)) return value;
            return proxyContextOptions.proxy(value, proxyContextOptions.getters, proxyContextOptions);
        });

        const fragments = Object.entries(snapshot)
            .filter(([, node]) => isUnknownJSXNode(node) && isFragment(node));

        const snapshotStatus: PromiseSettledResult<unknown>[] = snapshot.map(value => ({ value, status: "fulfilled" }));

        if (!fragments.length) {
            return yield snapshotStatus;
        }

        const workingSet: (PromiseSettledResult<unknown> | PromiseSettledResult<unknown>[])[] = [...snapshotStatus];
        for (const [index] of fragments) {
            workingSet[+index] = undefined;
        }

        for await (const fragmentUpdates of union(
            fragments.map(async function *([index, fragment]): AsyncIterable<[string, PromiseSettledResult<unknown>[]]> {
                if (!isFragment(fragment)) return;
                try {
                    for await (const snapshot of childrenSettledGenerator(fragment, options)) {
                        yield [index, snapshot];
                    }
                } catch (reason) {
                    yield [index, [{ reason, status: "rejected" }]]
                }
            })
        )) {
            for (const [index, snapshot] of fragmentUpdates.filter(Boolean)) {
                workingSet[+index] = snapshot;
            }
            yield workingSet.flatMap(value => value);
        }
    }
}

function flat(value: unknown): unknown[] {
    if (isArray(value)) {
        return value.flatMap(flat);
    }
    if (!isStaticChildNode(value) && isIterable(value)) {
        return [...value].flatMap(flat);
    }
    return [value];
}

export interface DescendantsOptions {
    [ThrowAtEnd]?: boolean
}

export function descendants(node: unknown, options?: DescendantsOptions) {
    return anAsyncThing(descendantsGenerator(node, options));
}

export function descendantsSettled(node: unknown, options?: DescendantsOptions) {
    return anAsyncThing(descendantsSettledGenerator(node, options));
}

export async function * descendantsGenerator(node: unknown, options?: DescendantsOptions) {
    let rejected: PromiseRejectedResult[];
    for await (const snapshot of descendantsSettledGenerator(node, options)) {
        rejected = snapshot.filter(isRejected);
        const resolvedSnapshot = snapshot.map(value => isFulfilled(value) ? value.value : undefined);
        if (!options?.[ThrowAtEnd]) {
            await throwIfRejected(rejected);
        }
        yield resolvedSnapshot;
    }
    await throwIfRejected(rejected);
}

export async function * descendantsSettledGenerator(node: unknown, options?: DescendantsOptions): AsyncIterable<PromiseSettledResult<unknown>[]> {

    let knownLength = 0;
    try {
        for await (const snapshot of descendantsSettledGeneratorInner()) {
            knownLength = snapshot.length;
            yield snapshot;
        }
    } catch (reason) {
        const rejected = { reason, status: "rejected"} as const;
        yield knownLength ? Array.from({ length: knownLength }, () => rejected) : [rejected];
    }

    async function * descendantsSettledGeneratorInner() {
        if (!isUnknownJSXNode(node)) return;
        const descendantCache = new WeakMap<UnknownJSXNode, PromiseSettledResult<unknown>[]>();

        for await (const snapshot of childrenSettledGenerator(node, options)) {

            yield snapshot;

            const nodes = Object.entries(
                snapshot
            )
                .filter(([, child]) => isFulfilled(child) && isUnknownJSXNode(child.value));

            const workingSet: (PromiseSettledResult<unknown> | PromiseSettledResult<unknown>[])[] = [...snapshot];
            for await (const childUpdates of union(
                nodes.map(
                    async function *([index, child]): AsyncIterable<[string, PromiseSettledResult<unknown>[]]> {
                        if (!isFulfilled(child)) return;
                        const node = child.value;
                        if (!isUnknownJSXNode(node)) return;
                        const cached = descendantCache.get(node);
                        if (cached) {
                            return yield [index, cached];
                        }
                        for await (const snapshot of descendantsSettledGenerator(node, options)) {
                            yield [index, snapshot];
                            descendantCache.set(node, snapshot);
                        }
                    }
                )
            )) {
                for (const [index, nodeSnapshot] of childUpdates.filter(Boolean)) {
                    workingSet[+index] = [
                        snapshot[+index],
                        ...nodeSnapshot
                    ];
                }
                yield workingSet.flatMap(value => value);
            }

        }
    }
}