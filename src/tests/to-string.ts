import {GetName, ToJSXString, ToKDLString} from "../to-string"
import {proxy} from "../access";

export default 1;

function Component() {
    return {
        $$type: "section",
        props: {
            id: "section-1"
        },
        children: [
            "Hello!",
            Promise.resolve("ASYNC" as const),
            {
                async *[Symbol.asyncIterator]() {
                    yield "WORLD" as const;
                },
            }
        ]
    } as const;
}
type ComponentType = ReturnType<typeof Component>;

const tree = {
    source: "main" as const,
    children: [
        1,
        "a" as const,
        {
            name: "child1" as const,
            children: {
                async *[Symbol.asyncIterator]() {
                    yield 1 as const;
                    // I expect to be able to do a compile time hoist of this type
                    yield Component() as ComponentType;
                },
            },
        },
        {
            name: "child2" as const,
            children: {
                *[Symbol.iterator]() {
                    yield 2 as const;
                    yield 3 as const;
                },
            },
        },
        {
            name: "fragment" as const,
            children: [55, 56],
        },
    ],
} as const;

type Tree = typeof tree;

type TreeKDLString = ToKDLString<Tree>;
type TreeJSXString = ToJSXString<Tree>;

const tKDL: TreeKDLString = "" as TreeKDLString;
const tJSX: TreeJSXString = "" as TreeJSXString;

let n: GetName<Tree>;

let treeSource: Tree["source"];