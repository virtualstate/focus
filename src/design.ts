import { h } from "./h";
import {isLike, ok} from "./like";
import {Push} from "@virtualstate/promise";

interface RelationContext {
  node: unknown;
  options?: Record<string, unknown>;
  children: (RelationDesigner | unknown)[];
}

const RelationDesigner = Symbol.for("@virtualstate/focus/designer");

type Options = Record<string | symbol, unknown>;

interface RelationDesigner extends Partial<Iterable<unknown>>, AsyncIterable<unknown> {
  readonly [RelationDesigner]: true;

  readonly context: Readonly<RelationContext>;

  h(node?: unknown, options?: unknown, ...children: unknown[]): RelationDesigner;
  createFragment(options?: unknown, ...children: unknown[]): RelationDesigner;

  add(
    node?: unknown,
    options?: unknown,
    ...children: unknown[]
  ): RelationDesigner;
  set(
    nodeOrDesigner: unknown,
    node?: unknown,
    options?: unknown,
    ...children: unknown[]
  ): RelationDesigner;
  delete(nodeOrDesigner: unknown): void;
  clear(): void;
  has(nodeOrDesigner: unknown): boolean;

  close(): void;
}

function isRelationDesigner(value: unknown): value is RelationDesigner {
  return isLike<RelationDesigner>(value) && value[RelationDesigner];
}

export interface DesignOptions extends Options {
  async?: boolean;
}

export function design(options?: DesignOptions): RelationDesigner {

  const designOptions = options ?? {};

  function createContext(
    node?: unknown,
    options?: Record<string, unknown>
  ): RelationContext {
    return {
      node,
      options,
      children: [],
    };
  }

  function createDesigner(
    context: RelationContext,
    ...parents: RelationContext[]
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

    let changes: Push<void> | undefined = undefined;

    if (designOptions.async) {
      changes = new Push({
        keep: true
      });
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
      let change = false;
      for (const snapshot of view()) {
        yield snapshot;
        change = true;
      }

      if (!changes) {
        return;
      }

      let { children } = context;
      let lastChildren = children

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
      changes.push();
    }

    const designers = new Set<RelationDesigner>();

    const designer: RelationDesigner = {
      [RelationDesigner]: true,
      [Symbol.for(":jsx/type")]: fragment,
      get context() {
        return Object.freeze(context);
      },
      h(...args: unknown[]) {
        return designer.add(...args);
      },
      createFragment(...args: unknown[]) {
        return designer.add(fragment, ...args);
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
        if (isRelationDesigner(existing) && designOptions.async) {
          designers.add(existing);
        }
        const relation = createRelation(
            node,
            options,
            children,
            context,
            ...parents
        );
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
          context,
          ...parents
        );
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
    ...parents: RelationContext[]
  ): RelationDesigner {
    const context = createContext(node, options);
    const designer = createDesigner(context, ...parents);

    if (children.length) {
      context.children.push(...children);
    }

    return designer;
  }

  return createRelation();
}
