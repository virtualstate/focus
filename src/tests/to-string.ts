import {GetName, JSX, KDL, HTML} from "../to-string";

export default 1;

const tree = {
    source: "main" as const,
    children: [
        1,
        "a" as const,
        {
            name: "child1" as const,
            children: {
                async *[Symbol.asyncIterator]() {
                    yield [99, "child1inner"] as const;
                },
            },
        },
        {
            name: "child2" as const
        },
        {
            name: "fragment" as const,
            children: [55, 56],
        },
    ],
} as const;

type Tree = typeof tree;

type TreeKDLString = KDL.ToString<Tree>;
type TreeJSXString = JSX.ToString<Tree>;
type TreeHTMLString = HTML.ToString<Tree>;

const tKDL: TreeKDLString = "" as TreeKDLString;
const tJSX: TreeJSXString = "" as TreeJSXString;
const tHTML: TreeHTMLString = "" as TreeHTMLString;

let n: GetName<Tree>;

let treeSource: Tree["source"];