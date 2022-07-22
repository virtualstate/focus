import {h} from "@virtualstate/focus";

interface RelationContext {
    node: unknown;
    children: RelationDesigner[];
}

interface RelationDesigner extends Iterable<unknown> {
    readonly context: Readonly<RelationContext>;

    add(node: unknown): RelationDesigner;
    delete(nodeOrDesigner: unknown): void;
    clear(): void;
    has(nodeOrDesigner: unknown): boolean;
}

export function design(parent?: unknown): RelationDesigner {
    function createContext(node?: unknown): RelationContext {
        return {
            node,
            children: []
        }
    }
    function createRelation(node: unknown, ...parents: RelationContext[]): RelationDesigner {
        const context = createContext(node);

        function findIndex(nodeOrDesigner: unknown) {
            return context.children.findIndex(
                designer => designer === nodeOrDesigner || designer.context.node === nodeOrDesigner
            );
        }

        return {
            get context() {
                return Object.freeze(context);
            },
            add(node: unknown) {
                const relation = createRelation(
                    node,
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
            *[Symbol.iterator]() {
                const { node } = context;
                if (typeof node === "undefined") {
                    yield [...context.children];
                } else {
                    yield h(node, {}, ...context.children);
                }
            }
        };
    }

    return createRelation(parent);
}