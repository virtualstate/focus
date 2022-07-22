import {h} from "@virtualstate/focus";

interface RelationContext {
    node: unknown;
    options?: Record<string, unknown>;
    children: RelationDesigner[];
}

interface RelationDesigner extends AsyncIterable<unknown> {
    readonly context: Readonly<RelationContext>;

    add(node: unknown, options?: unknown): RelationDesigner;
    delete(nodeOrDesigner: unknown): void;
    clear(): void;
    has(nodeOrDesigner: unknown): boolean;
}

export function design(parent?: unknown, options?: Record<string, unknown>): RelationDesigner {
    function createContext(node?: unknown, options?: Record<string, unknown>): RelationContext {
        return {
            node,
            options,
            children: []
        }
    }
    function createRelation(node: unknown, options: Record<string, unknown>, ...parents: RelationContext[]): RelationDesigner {
        const context = createContext(node, options);

        function findIndex(nodeOrDesigner: unknown) {
            return context.children.findIndex(
                designer => designer === nodeOrDesigner || designer.context.node === nodeOrDesigner
            );
        }

        return {
            [Symbol.for(":jsx/type")]: Symbol.for(":jsx/fragment"),
            get context() {
                return Object.freeze(context);
            },
            add(node: unknown, options?: Record<string, unknown>) {
                const relation = createRelation(
                    node,
                    options,
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
                const { node, options } = context;
                if (typeof node === "undefined") {
                    yield h("fragment", options, ...context.children);
                } else {
                    yield h(node, options, ...context.children);
                }
            }
        };
    }

    return createRelation(parent, options);
}