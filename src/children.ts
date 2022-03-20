import { UnknownJSXNode } from "./node";
import {
  getChildrenFromRawNode,
  isFragment,
  isProxyContextOptions,
} from "./access";
import { isArray, isAsyncIterable, isIterable } from "./is";
import { union } from "@virtualstate/union";
import { anAsyncThing, TheAsyncThing } from "@virtualstate/promise/the-thing";
import { component } from "./component";
import { ChildrenArray, ChildrenSettledArray } from "./children-output";
import { all } from "@virtualstate/promise";
import {
  isFulfilled,
  isRejected,
  isStaticChildNode,
  isUnknownJSXNode,
} from "./like";

const ThrowAtEnd = Symbol.for("@virtualstate/focus/access/throwAtEnd");

export interface ChildrenOptions {
  [ThrowAtEnd]?: boolean;
  component?: typeof component;
}

export function children<N>(node: N): TheAsyncThing<ChildrenArray<N>>;
export function children<N>(
  node: N,
  options?: ChildrenOptions
): TheAsyncThing<ChildrenArray<N>>;
export function children(
  node: unknown,
  options?: ChildrenOptions
): TheAsyncThing<unknown[]>;
export function children(
  node?: unknown,
  options?: ChildrenOptions,
  ...rest: unknown[]
): unknown {
  return anAsyncThing(childrenGenerator(node, options === 1 ? {} : options));
}

export function childrenGenerator<N>(
  node: unknown,
  options?: ChildrenOptions
): AsyncIterable<ChildrenArray<N>>;
export function childrenGenerator(
  node: unknown,
  options?: ChildrenOptions
): AsyncIterable<unknown[]>;
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

export function childrenSettled<N>(
  node: N,
  options?: ChildrenOptions
): TheAsyncThing<ChildrenSettledArray<N>>;
export function childrenSettled(
  node: unknown,
  options?: ChildrenOptions
): TheAsyncThing<PromiseSettledResult<unknown>[]>;
export function childrenSettled(
  node: unknown,
  options?: ChildrenOptions
): TheAsyncThing<PromiseSettledResult<unknown>[]> {
  return anAsyncThing(childrenSettledGenerator(node, options));
}

export function childrenSettledGenerator<N>(
  node: N,
  options?: ChildrenOptions
): AsyncIterable<ChildrenSettledArray<N>>;
export function childrenSettledGenerator(
  node: unknown,
  options?: ChildrenOptions
): AsyncIterable<PromiseSettledResult<unknown>[]>;
export async function* childrenSettledGenerator(
  node: unknown,
  options?: ChildrenOptions
): AsyncIterable<PromiseSettledResult<unknown>[]> {
  if (!isUnknownJSXNode(node)) return;
  let knownLength = 0;
  try {
    for await (const snapshot of childrenSettledGeneratorInner(
      getChildrenFromRawNode(node),
      (options?.component ?? component)(node)
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
    component?: AsyncIterable<unknown>
  ): ReturnType<typeof yieldSnapshot> {
    if (component && isAsyncIterable(component)) {
      yield* childrenSettledGeneratorInner(component);
    } else if (isIterable(input)) {
      yield* yieldSnapshot(input);
    } else if (isAsyncIterable(input)) {
      for await (const next of input) {
        yield* yieldSnapshot(next);
      }
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
      yield workingSet.flatMap((value) => value);
    }

    for await (const fragmentUpdates of all(
      fragments.map(async function* ([index, fragment]): AsyncIterable<
        [string, PromiseSettledResult<unknown>[]]
      > {
        if (!isFragment(fragment)) return;
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
      yield workingSet.flatMap((value) => value);
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
  return anAsyncThing(descendantsGenerator(node, options));
}

export function descendantsSettled(
  node: unknown,
  options?: DescendantsOptions
) {
  return anAsyncThing(descendantsSettledGenerator(node, options));
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

  yield * descendantsSettledGeneratorCaught(node, options);

  async function *descendantsSettledGeneratorCaught(
      node: unknown,
      options?: DescendantsOptions) {
    if (!isUnknownJSXNode(node)) return;
    const parent = node;
    let knownLength = 0;
    try {
      for await (const snapshot of descendantsSettledGeneratorInner(node, options)) {
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
      options?: DescendantsOptions): AsyncIterable<
    DescendantPromiseSettledResult[]
  > {
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
        yield workingSet.flatMap((value) => value);
      }
    }
  }
}
