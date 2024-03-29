import { h } from "./static-h";
import { isLike, isUnknownJSXNode, ok } from "./like";
import { Push } from "@virtualstate/promise";

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
const RelationDesignerContext = Symbol.for("@virtualstate/focus/designer/context");
const RelationDesignerEmit = Symbol.for("@virtualstate/focus/designer/emit");

type Options = Record<string | symbol, unknown>;

export interface RelationDesigner extends Partial<Iterable<unknown>>, AsyncIterable<unknown> {
  /**
   * @internal
   */
  readonly [RelationDesigner]: true;

  /**
   * @internal
   */
  readonly [RelationDesignerContext]: Readonly<RelationContext>;

  /**
   * @internal
   */
  readonly [RelationDesignerEmit]: () => void;

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

export function designer(node?: unknown): RelationDesigner | undefined {
  if (!isUnknownJSXNode(node)) return undefined;
  const designer = node[RelationDesigner];
  if (!isRelationDesigner(designer)) return undefined;
  return designer;
}

export function isRelationDesigner(value: unknown): value is RelationDesigner {
  return isLike<RelationDesigner>(value) && value[RelationDesigner] === true && !!value[RelationDesignerContext];
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
      seen: parents?.[0]?.[RelationDesignerContext]?.seen ?? new WeakSet()
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
             designer[RelationDesignerContext].node === nodeOrDesigner
          )
      );
    }

    const fragment = Symbol.for(":jsx/fragment");

    let changes: Push<void> | undefined = undefined,
        changesCurrentTask = 0,
        emitTask: () => void | undefined = undefined;

    if (designOptions.async) {
      changes = new Push();
    }

    function *view() {
      const { node, options, children } = context;
      let result;
      if (typeof node === "undefined") {
        if (!children.length) {
          return;
        }
        result = h(fragment, options, ...children);
      } else {
        result = h(node, options, ...children);
      }
      if (!result[RelationDesigner]) {
        Object.defineProperty(result, RelationDesigner, {
          value: designer
        });
      }
      yield result;
    }

    async function *watch() {
      if (!changes) return yield * view();

      const { children } = context;
      let lastChildren = [...children]

      for (const snapshot of view()) {
        lastChildren = [...children];
        yield snapshot;
      }

      for await (const _ of changes) {
        const same = (
            lastChildren.length === children.length &&
            children.every(
                (child, index) => child === children[index]
            )
        );
        if (same) {
          continue;
        }
        for (const snapshot of view()) {
          yield snapshot;
        }
        lastChildren = [...children];
      }
    }

    function emit() {
      if (!changes) return;
      ok(changes.open, "No changes can be made");
      const isFirstChange = changesCurrentTask > 0;
      changesCurrentTask += 1;
      if (!isFirstChange) return;
      changes.push();
      emitTask = () => {
        // If there has been more changes since the initial change at the start of this
        // task, then push out another change
        // Means we can reduce the amount of emitted to a maximum of two per task.
        if (changesCurrentTask > 1 && changes.open) {
          changes.push();
        }
        changesCurrentTask = 0;
        emitTask = undefined;
      }
      queueMicrotask(emitTask);
    }

    const designers = new Set<RelationDesigner>();

    const designer: RelationDesigner = {
      [RelationDesigner]: true,
      [RelationDesignerContext]: context,
      [RelationDesignerEmit]: emit,
      [Symbol.for(":jsx/type")]: fragment,
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
        ok(changes.open, "Already closed");
        emitTask?.(); // Clean up emit before closing
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
            // This would only be true if it were from another design
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
