import { aSyncThing, TheSyncThing } from "@virtualstate/promise/the-sync-thing";
import {
  DescendantPromiseRejectedResult,
  DescendantPromiseSettledResult,
  DescendantsOptions,
} from "./children";
import { isArray, isIterable } from "./is";
import {
  assertFulfilled,
  isDescendantFulfilled,
  isFulfilled,
  isRejected,
  isStaticChildNode,
  isUnknownJSXNode,
} from "./like";
import { component, ComponentIterable } from "./component";
import {
  getChildrenFromRawNode,
  isFragment,
  isProxyContextOptions,
} from "./access";
import { UnknownJSXNode } from "./node";

const ThrowAtEnd = Symbol.for("@virtualstate/focus/access/throwAtEnd");

export interface ChildrenSyncOptions {
  [ThrowAtEnd]?: boolean;
  component?(node?: unknown, options?: object): ComponentIterable | undefined;
}

export function childrenSync(node?: unknown, options?: ChildrenSyncOptions) {
  return aSyncThing({
    *[Symbol.iterator]() {
      yield* childrenGeneratorSync(node, options);
    },
  });
}

export function* childrenGeneratorSync(
  node?: unknown,
  options?: ChildrenSyncOptions
) {
  const rejected: PromiseRejectedResult[] = [];
  for (const status of childrenSettledGeneratorSync(node, options)) {
    if (options?.[ThrowAtEnd]) {
      if (isRejected(status)) {
        rejected.push(status);
        yield undefined;
      } else {
        yield status.value;
      }
    } else {
      assertFulfilled(status);
      yield status.value;
    }
  }
  throwIfRejected(rejected);
}

function throwIfRejected(
  rejected: (PromiseRejectedResult | DescendantPromiseRejectedResult)[]
): asserts rejected is never[] {
  if (!rejected?.length) return;
  const reasons = [...new Set(rejected.map(({ reason }) => reason))];
  if (reasons.length === 1) {
    throw reasons[0];
  } else {
    throw new AggregateError(reasons);
  }
}

export function childrenSettledSync(
  node?: unknown,
  options?: ChildrenSyncOptions
) {
  return aSyncThing({
    *[Symbol.iterator]() {
      yield* childrenSettledGeneratorSync(node, options);
    },
  });
}

export function* childrenSettledGeneratorSync(
  node?: unknown,
  options?: ChildrenSyncOptions
) {
  if (!isUnknownJSXNode(node)) return;
  const componentFn: typeof options.component = options?.component ?? component;

  yield* childrenSettledGeneratorInner(
    getChildrenFromRawNode(node),
    componentFn(node, options)
  );

  function* childrenSettledGeneratorInner(
    input: ReturnType<typeof getChildrenFromRawNode>,
    component?: ComponentIterable
  ): ReturnType<typeof yieldSnapshot> {
    if (component && isIterable(component)) {
      yield* childrenSettledGeneratorInner(component);
    } else if (isIterable(input)) {
      yield* yieldSnapshot(input);
    }
  }

  function* yieldSnapshot(
    input: unknown
  ): Iterable<PromiseSettledResult<unknown>> {
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
      return yield* snapshotStatus;
    }

    for (const value of snapshot) {
      if (isUnknownJSXNode(value) && isFragment(value)) {
        yield* childrenSettledGeneratorSync(value, options);
      } else {
        yield { value, status: "fulfilled" };
      }
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

export interface DescendantsSyncOptions {
  [ThrowAtEnd]?: boolean;
}

export function descendantsSync(
  node: unknown,
  options?: DescendantsSyncOptions
): TheSyncThing {
  return aSyncThing({
    *[Symbol.iterator]() {
      yield* descendantsGeneratorSync(node, options);
    },
  });
}

export function* descendantsGeneratorSync(
  node?: unknown,
  options?: ChildrenSyncOptions
) {
  const rejected: PromiseRejectedResult[] = [];
  for (const status of descendantsSettledGeneratorSync(node, options)) {
    if (options?.[ThrowAtEnd]) {
      if (isRejected(status)) {
        rejected.push(status);
        yield undefined;
      } else {
        yield status.value;
      }
    } else {
      assertFulfilled(status);
      yield status.value;
    }
  }
  throwIfRejected(rejected);
}

export function descendantsSettledSync(
  node: unknown,
  options?: DescendantsSyncOptions
): TheSyncThing<DescendantPromiseSettledResult> {
  return aSyncThing({
    *[Symbol.iterator]() {
      yield* descendantsSettledGeneratorSync(node, options);
    },
  });
}

export function* descendantsSettledGeneratorSync(
  node: unknown,
  options?: DescendantsSyncOptions
): Iterable<DescendantPromiseSettledResult> {
  yield* descendantsSettledGeneratorCaught(node, options);

  function* descendantsSettledGeneratorCaught(
    node: unknown,
    options?: DescendantsSyncOptions
  ): Iterable<DescendantPromiseSettledResult> {
    if (!isUnknownJSXNode(node)) return;
    yield* descendantsSettledGeneratorInner(node, options);
  }

  function* descendantsSettledGeneratorInner(
    node: unknown,
    options?: DescendantsSyncOptions
  ): Iterable<DescendantPromiseSettledResult> {
    if (!isUnknownJSXNode(node)) return;
    const parent = node;
    const descendantCache = new WeakMap<
      UnknownJSXNode,
      DescendantPromiseSettledResult[]
    >();

    for (const snapshot of childrenSettledGeneratorSync(node, options)) {
      yield {
        ...snapshot,
        parent,
      };

      if (!isFulfilled(snapshot)) {
        continue;
      }

      const { value } = snapshot;

      if (!isUnknownJSXNode(value)) {
        continue;
      }

      yield* descendantsSettledGeneratorSync(value, options);
    }
  }
}
