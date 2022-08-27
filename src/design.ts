import { h } from "./h";
import {isLike, ok} from "./like";
import {Push} from "@virtualstate/promise";

/**
 * @internal
 */
export interface RelationContext {
  node: unknown;
  options?: Record<string, unknown>;
  children: (RelationDesigner | unknown)[];
  parents: RelationDesigner[];
  seen: WeakSet<RelationDesigner>;
}

const RelationDesigner = Symbol.for("@virtualstate/focus/designer");

type Options = Record<string | symbol, unknown>;

export interface RelationDesigner extends Partial<Iterable<unknown>>, AsyncIterable<unknown> {
  /**
   * @internal
   */
  readonly [RelationDesigner]: true;

  /**
   * @internal
   */
  readonly context: Readonly<RelationContext>;

  h(node?: unknown, options?: unknown, ...children: unknown[]): RelationDesigner;
  createFragment(options?: unknown, ...children: unknown[]): RelationDesigner;

  add(
    node?: unknown,
    options?: unknown,
    ...children: unknown[]
  ): RelationDesigner;
  set(
    nodeOrDesigner?: unknown,
    node?: unknown,
    options?: unknown,
    ...children: unknown[]
  ): RelationDesigner;
  get(nodeOrDesigner?: unknown): RelationDesigner;
  delete(nodeOrDesigner: unknown): void;
  clear(): void;
  has(nodeOrDesigner: unknown): boolean;

  close(): void;
}

export function isRelationDesigner(value: unknown): value is RelationDesigner {
  return isLike<RelationDesigner>(value) && value[RelationDesigner];
}

export interface DesignOptions extends Options {
  async?: boolean;
}

export function design(options?: DesignOptions): RelationDesigner {

  const designOptions = options ?? {};

  function createContext(
    node?: unknown,
    options?: Record<string, unknown>,
    parents?: RelationDesigner[]
  ): RelationContext {
    return {
      node,
      options,
      children: [],
      parents,
      seen: parents[0]?.context.seen ?? new WeakSet()
    };
  }

  function createDesigner(
    context: RelationContext,
    ...parents: RelationDesigner[]
  ): RelationDesigner {
    function findIndex(nodeOrDesigner: unknown) {
      return context.children.findIndex(
        (designer) =>
          designer === nodeOrDesigner ||
          (
             isRelationDesigner(designer) &&
             designer.context.node === nodeOrDesigner
          )
      );
    }

    const fragment = Symbol.for(":jsx/fragment");

    let changes: Push<void> | undefined = undefined,
        changesThisTask = 0;

    if (designOptions.async) {
      changes = new Push();
    }

    function *view() {
      const { node, options, children } = context;
      if (typeof node === "undefined") {
        if (!children.length) {
          return;
        }
        yield h(fragment, options, ...children);
      } else {
        yield h(node, options, ...children);
      }
    }

    async function *watch() {
      let { children } = context;
      let lastChildren = [...children]

      let change = false;
      for (const snapshot of view()) {
        ({ children } = context);
        lastChildren = [...children]
        yield snapshot;
        change = true;
      }

      if (!changes) {
        return;
      }

      for await (const _ of changes) {
        ({ children } = context);
        const same = (
            lastChildren.length === children.length &&
            children.every(
                (child, index) => child === children[index]
            )
        );
        if (same) continue;
        for (const snapshot of view()) {
          yield snapshot;
          change = true;
        }
        lastChildren = [...children];
      }
      if (!change) {
        yield * view();
      }
    }

    function emit() {
      if (!changes) return;
      ok(changes.open, "No changes can be made");
      const isFirstChange = changesThisTask > 0;
      changesThisTask += 1;
      if (!isFirstChange) return;
      changes.push();
      queueMicrotask(() => {
        // If there has been more changes since the initial change at the start of this
        // task, then push out another change
        // Means we can reduce the amount of emitted to a maximum of two per task.
        if (changesThisTask > 1 && changes.open) {
          changes.push();
        }
        changesThisTask = 0;
      })
    }

    const designers = new Set<RelationDesigner>();

    const designer: RelationDesigner = {
      [RelationDesigner]: true,
      [Symbol.for(":jsx/type")]: fragment,
      get context() {
        return context;
      },
      h(...args: unknown[]) {
        return designer.add(...args);
      },
      createFragment(...args: unknown[]) {
        return designer.add(fragment, ...args);
      },
      get(nodeOrDesigner?: unknown) {
        const index = findIndex(nodeOrDesigner);
        if (index === -1) return undefined;
        const found = context.children[index];
        if (!isRelationDesigner(found)) return undefined;
        return found;
      },
      set(
        nodeOrDesigner: unknown,
        node?: unknown,
        options?: Options,
        ...children: unknown[]
      ) {
        if (node === designer.h || node === designer.createFragment) {
          node = fragment;
        }
        const index = findIndex(nodeOrDesigner);
        if (index === -1) {
          return designer.add(node, options, ...children);
        }
        const existing = context.children[index];
        if (isRelationDesigner(existing)) {
          designers.add(existing);
        }
        const relation = createRelation(
            node,
            options,
            children,
            this,
            ...parents
        );
        context.seen.add(relation);
        context.children[index] = relation;
        emit();
        return relation;
      },
      add(
        node?: unknown,
        options?: Options,
        ...children: unknown[]
      ) {
        if (node === designer.h || node === designer.createFragment) {
          node = fragment;
        }
        const relation = createRelation(
          node,
          options,
          children,
          this,
          ...parents
        );
        context.seen.add(relation);
        context.children.push(relation);
        emit();
        return relation;
      },
      delete(nodeOrDesigner: unknown) {
        const index = findIndex(nodeOrDesigner);
        if (index === -1) return;
        context.children.splice(index, 1);
        emit();
      },
      has(nodeOrDesigner: unknown) {
        return findIndex(nodeOrDesigner) > -1;
      },
      clear() {
        context.children = [];
        emit();
      },
      [Symbol.iterator]: view,
      [Symbol.asyncIterator]: watch,
      close() {
        ok(designOptions.async, "Requires async to be in use");
        ok(changes);
        for (const child of context.children) {
          if (!isRelationDesigner(child)) continue;
          child.close();
        }
        for (const designer of designers) {
          designer.close();
        }
        changes.close();
      }
    };

    if (designOptions.async) {
      // Remove sync view
      designer[Symbol.iterator] = undefined;
    }

    return designer;
  }

  function createRelation(
    node: unknown = undefined,
    options: Record<string, unknown> = {},
    children: unknown[] = [],
    ...parents: RelationDesigner[]
  ): RelationDesigner {
    const context = createContext(node, options, parents);
    const designer = createDesigner(context, ...parents);

    if (children.length) {
      for (const child of children) {
        if (isRelationDesigner(child)) {
          if (context.seen.has(child)) {
            for (const parent of parents) {
              if (parent.has(child)) {
                // Pull down same instance
                parent.delete(child);
              }
            }
          } else {
            context.seen.add(child);
          }
        }
        context.children.push(child);
      }

    }

    return designer;
  }

  return createRelation();
}
