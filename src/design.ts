import { h } from "./h";
import {isLike} from "./like";

interface RelationContext {
  node: unknown;
  options?: Record<string, unknown>;
  children: (RelationDesigner | unknown)[];
}

const RelationDesigner = Symbol.for("@virtualstate/focus/designer");

type Options = Record<string | symbol, unknown>;

interface RelationDesigner extends AsyncIterable<unknown> {
  readonly [RelationDesigner]: true;

  readonly context: Readonly<RelationContext>;

  h(node: unknown, options?: unknown, ...children: unknown[]): RelationDesigner;
  createFragment(options?: unknown, ...children: unknown[]): RelationDesigner;

  add(
    node: unknown,
    options?: unknown,
    ...children: unknown[]
  ): RelationDesigner;
  delete(nodeOrDesigner: unknown): void;
  clear(): void;
  has(nodeOrDesigner: unknown): boolean;
}


function isRelationDesigner(value: unknown): value is RelationDesigner {
  return isLike<RelationDesigner>(value) && value[RelationDesigner];
}

export function design(
  parent?: unknown,
  options?: Record<string, unknown>,
  ...children: unknown[]
): RelationDesigner {
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

    const designer: RelationDesigner = {
      [RelationDesigner]: true,
      [Symbol.for(":jsx/type")]: fragment,
      get context() {
        return Object.freeze(context);
      },
      get h() {
        return designer.add.bind(designer);
      },
      get createFragment() {
        return designer.add.bind(designer, fragment);
      },
      add(
        node: unknown,
        options?: Options,
        ...children: unknown[]
      ) {
        const relation = createRelation(
          node,
          options,
          children,
          context,
          ...parents
        );
        context.children.push(relation);
        return relation;
      },
      delete(nodeOrDesigner: unknown) {
        const index = findIndex(nodeOrDesigner);
        if (index === -1) return;
        context.children.splice(index, 1);
      },
      has(nodeOrDesigner: unknown) {
        return findIndex(nodeOrDesigner) > -1;
      },
      clear() {
        context.children = [];
      },
      async *[Symbol.asyncIterator]() {
        const { node, options, children } = context;
        if (typeof node === "undefined") {
          if (!children.length) {
            return;
          }
          yield h(fragment, options, ...children);
        } else {
          yield h(node, options, ...children);
        }
      },
    };
    return designer;
  }

  function createRelation(
    node: unknown,
    options: Record<string, unknown>,
    children: unknown[],
    ...parents: RelationContext[]
  ): RelationDesigner {
    const context = createContext(node, options);
    const designer = createDesigner(context, ...parents);

    context.children.push(...children);

    return designer;
  }

  return createRelation(parent, options, children);
}
