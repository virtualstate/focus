import {isFragmentResult, UnknownJSXNode} from "./access";
import {
  getChildrenFromRawNode,
  isFragment,
  isProxyContextOptions,
} from "./access";
import { isArray, isAsyncIterable, isIterable } from "./is";
import { union } from "@virtualstate/union";
import { anAsyncThing, TheAsyncThing } from "@virtualstate/promise/the-thing";
import { component, ComponentIterable } from "./component";
import { ChildrenArray, ChildrenSettledArray } from "./children-output";
import {all, Split, split, SplitOptions} from "@virtualstate/promise";
import {
  isFulfilled, isKey,
  isRejected,
  isStaticChildNode,
  isUnknownJSXNode,
  ok,
} from "./like";

const ThrowAtEnd = Symbol.for("@virtualstate/focus/access/throwAtEnd");

export interface ChildrenOptions {
  [ThrowAtEnd]?: boolean;
  component?(node?: unknown, options?: object): ComponentIterable | undefined;
}

export function result<T>(input: AsyncIterable<T | T[]>): Split<T>
export function result<T>(input: T | T[]): Split<T>
export function result<T>(input: AsyncIterable<T | T[]> | T | T[]): Split<T> {
  const fragment = Symbol.for(":jsx/fragment");
  const result = Symbol.for(":jsx/result");
  const options: SplitOptions & Record<symbol, symbol> = {
    [fragment]: result
  }
  const value: Split<T> & { [fragment]?: unknown } = split<T>(
      isAsyncIterable(input) ? input :
      {
        async *[Symbol.asyncIterator]() {
          ok(!isAsyncIterable(input));
          yield input;
        }
      },
      options
  );
  ok(options[fragment] === result);
  ok(value[fragment] === result);
  return value;
}

export function children(node?: unknown, options?: ChildrenOptions) {
  return result({
    async *[Symbol.asyncIterator]() {
      yield* childrenGenerator(node, options ?? {});
    },
  });
}

export async function* childrenGenerator(
  node: unknown,
  options?: ChildrenOptions
): AsyncIterable<unknown[]> {
  let rejected: PromiseRejectedResult[];
  for await (const snapshot of childrenSettledGenerator(node, options)) {
    rejected = snapshot.filter(isRejected);
    const resolvedSnapshot = snapshot.map((value) =>
      isFulfilled(value) ? value.value : undefined
    );
    if (!options?.[ThrowAtEnd]) {
      await throwIfRejected(rejected);
    }
    yield resolvedSnapshot;
  }
  await throwIfRejected(rejected);
}

async function throwIfRejected(
  rejected: (PromiseRejectedResult | DescendantPromiseRejectedResult)[]
) {
  if (!rejected?.length) return;
  const reasons = [...new Set(rejected.map(({ reason }) => reason))];
  if (reasons.length === 1) {
    throw await Promise.reject(reasons[0]);
  } else {
    throw new AggregateError(reasons);
  }
}

export function childrenSettled(
  node: unknown,
  options?: ChildrenOptions
): Split<PromiseSettledResult<unknown>> {
  return result({
    async *[Symbol.asyncIterator]() {
      yield* childrenSettledGenerator(node, options);
    },
  });
}

export async function* childrenSettledGenerator(
  node: unknown,
  options?: ChildrenOptions
): AsyncIterable<PromiseSettledResult<unknown>[]> {
  if (!isUnknownJSXNode(node)) return;

  if (isFragmentResult(node)) {
    for await (const snapshot of childrenSettledGeneratorInner(getChildrenFromRawNode(node))) {
      for await (const snapshots of union(
          snapshot.map(
              async function *(state) {
                if (isFulfilled(state)) {
                  yield * childrenSettledGenerator(state.value, options);
                } else {
                  yield [state]
                }
              }
          )
      )) {
        yield snapshots.flat(1);
      }
    }
    return;
  }

  let knownLength = 0;
  try {
    const componentFn: typeof options.component =
      options?.component ?? component;
    for await (const snapshot of childrenSettledGeneratorInner(
      getChildrenFromRawNode(node),
      componentFn(node, options)
    )) {
      knownLength = snapshot.length;
      yield snapshot;
    }
  } catch (reason) {
    const rejected = { reason, status: "rejected" } as const;
    yield knownLength
      ? Array.from({ length: knownLength }, () => rejected)
      : [rejected];
  }

  async function* childrenSettledGeneratorInner(
    input: ReturnType<typeof getChildrenFromRawNode>,
    component?: ComponentIterable
  ): ReturnType<typeof yieldSnapshot> {
    if (component && isAsyncIterable(component)) {
      yield* childrenSettledGeneratorInner(component);
    } else if (isAsyncIterable(input)) {
      for await (const next of input) {
        yield* yieldSnapshot(next);
      }
    } else if (isIterable(input)) {
      yield* yieldSnapshot(input);
    }
  }

  async function* yieldSnapshot(
    input: unknown
  ): AsyncIterable<PromiseSettledResult<unknown>[]> {
    const proxyContextOptions = isProxyContextOptions(options)
      ? options
      : undefined;
    const snapshot = flat(input).map((value) => {
      if (!proxyContextOptions) return value;
      if (!isUnknownJSXNode(value)) return value;
      return proxyContextOptions.proxy(
        value,
        proxyContextOptions.getters,
        proxyContextOptions
      );
    });

    const fragments = Object.entries(snapshot).filter(
      ([, node]) => isUnknownJSXNode(node) && isFragment(node)
    );

    const snapshotStatus: PromiseSettledResult<unknown>[] = snapshot.map(
      (value) => ({ value, status: "fulfilled" })
    );

    if (!fragments.length) {
      return yield snapshotStatus;
    }

    const workingSet: (
      | PromiseSettledResult<unknown>
      | PromiseSettledResult<unknown>[]
    )[] = [...snapshotStatus];
    for (const [index] of fragments) {
      workingSet[+index] = undefined;
    }

    if (fragments.length !== snapshot.length) {
      yield workingSet
        .flatMap((value) => value)
        .filter((node) => isUnknownJSXNode(node) || isStaticChildNode(node));
    }

    for await (const fragmentUpdates of all(
      fragments.map(async function* ([index, fragment]): AsyncIterable<
        [string, PromiseSettledResult<unknown>[]]
      > {
        ok(isFragment(fragment));
        try {
          for await (const snapshot of childrenSettledGenerator(
            fragment,
            options
          )) {
            yield [index, snapshot];
          }
        } catch (reason) {
          yield [index, [{ reason, status: "rejected" }]];
        }
      })
    )) {
      for (const [index, snapshot] of fragmentUpdates.filter(Boolean)) {
        workingSet[+index] = snapshot;
      }
      yield workingSet
        .flatMap((value) => value)
        .filter((node) => isUnknownJSXNode(node) || isStaticChildNode(node));
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
  [ThrowAtEnd]?: boolean;
}

export function descendants(node: unknown, options?: DescendantsOptions) {
  return result({
    async *[Symbol.asyncIterator]() {
      yield* descendantsGenerator(node, options);
    },
  });
}

export function descendantsSettled(
  node: unknown,
  options?: DescendantsOptions
) {
  return result({
    async *[Symbol.asyncIterator]() {
      yield* descendantsSettledGenerator(node, options);
    },
  });
}

export async function* descendantsGenerator(
  node: unknown,
  options?: DescendantsOptions
) {
  let rejected: DescendantPromiseRejectedResult[];
  for await (const snapshot of descendantsSettledGenerator(node, options)) {
    rejected = snapshot.filter<DescendantPromiseRejectedResult>(isRejected);
    const resolvedSnapshot = snapshot.map((value) =>
      isFulfilled(value) ? value.value : undefined
    );
    if (!options?.[ThrowAtEnd]) {
      await throwIfRejected(rejected);
    }
    yield resolvedSnapshot;
  }
  await throwIfRejected(rejected);
}

export interface DescendantPromiseFulfilledResult
  extends PromiseFulfilledResult<unknown> {
  parent: UnknownJSXNode;
}

export interface DescendantPromiseRejectedResult extends PromiseRejectedResult {
  parent: UnknownJSXNode;
}

export type DescendantPromiseSettledResult =
  | DescendantPromiseFulfilledResult
  | DescendantPromiseRejectedResult;

export async function* descendantsSettledGenerator(
  node: unknown,
  options?: DescendantsOptions
): AsyncIterable<DescendantPromiseSettledResult[]> {
  yield* descendantsSettledGeneratorCaught(node, options);

  async function* descendantsSettledGeneratorCaught(
    node: unknown,
    options?: DescendantsOptions
  ) {
    if (!isUnknownJSXNode(node)) return;
    const parent = node;
    let knownLength = 0;
    try {
      for await (const snapshot of descendantsSettledGeneratorInner(
        node,
        options
      )) {
        knownLength = snapshot.length;
        yield snapshot;
      }
    } catch (reason) {
      const rejected = { reason, status: "rejected", parent } as const;
      yield knownLength
        ? Array.from({ length: knownLength }, () => rejected)
        : [rejected];
    }
  }

  async function* descendantsSettledGeneratorInner(
    node: unknown,
    options?: DescendantsOptions
  ): AsyncIterable<DescendantPromiseSettledResult[]> {
    if (!isUnknownJSXNode(node)) return;
    const parent = node;
    const descendantCache = new WeakMap<
      UnknownJSXNode,
      DescendantPromiseSettledResult[]
    >();

    for await (const snapshotInput of childrenSettledGenerator(node, options)) {
      const snapshot = snapshotInput.map((result) => ({ parent, ...result }));
      yield snapshot;

      const nodes = Object.entries(snapshot).filter(
        ([, child]) => isFulfilled(child) && isUnknownJSXNode(child.value)
      );

      const workingSet: (
        | DescendantPromiseSettledResult
        | DescendantPromiseSettledResult[]
      )[] = [...snapshot];
      for await (const childUpdates of union(
        nodes.map(async function* ([index, child]): AsyncIterable<
          [string, DescendantPromiseSettledResult[]]
        > {
          if (!isFulfilled(child)) return;
          const node = child.value;
          if (!isUnknownJSXNode(node)) return;
          const cached = descendantCache.get(node);
          if (cached) {
            return yield [index, cached];
          }
          for await (const snapshotInput of descendantsSettledGeneratorCaught(
            node,
            options
          )) {
            const snapshot = snapshotInput.map((result) => ({
              parent,
              ...result,
            }));
            yield [index, snapshot];
            descendantCache.set(node, snapshot);
          }
        })
      )) {
        for (const [index, nodeSnapshot] of childUpdates.filter(Boolean)) {
          workingSet[+index] = [snapshot[+index], ...nodeSnapshot];
        }
        yield workingSet.flatMap((value) => value).filter((result) => !!result);
      }
    }
  }
}
