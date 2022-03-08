import { GetName, JSX, KDL, HTML } from "../to-string";

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
      name: "child2" as const,
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

let tKDL: TreeKDLString;
let tJSX: TreeJSXString;
let tHTML: TreeHTMLString;

let n: GetName<Tree>;

const tree2 = {
  source: "main" as const,
  props: {
    id: "main",
    class: "section",
  },
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
      name: "input" as const,
      options: {
        value: 2,
        type: "number",
      },
    },
    {
      name: "fragment" as const,
      children: [55, 59],
    },
    {
      name: Symbol.for(":kdl/fragment"),
      children: [60],
    },
    {
      name: Symbol.for(":jsx/fragment"),
      children: [61],
    },
  ],
} as const;

type Tree2 = typeof tree2;
type Tree2KDLString = KDL.ToString<Tree2>;
type Tree2JSXString = JSX.ToString<Tree2>;
type Tree2HTMLString = HTML.ToString<Tree2>;

type Tree2Props = KDL.PropertiesToString<Tree2>;
let t2Props: Tree2Props;

let t2KDL: Tree2KDLString;
let t2JSX: Tree2JSXString;
let t2HTML: Tree2HTMLString;

type IsMatch<L, R> = L extends R ? true : false;

let t1To2MatchKDL: IsMatch<TreeKDLString, Tree2KDLString>;
let t1To2MatchJSX: IsMatch<TreeJSXString, Tree2JSXString>;
let t1To2MatchHTML: IsMatch<TreeHTMLString, Tree2HTMLString>;

let t2To2MatchKDL: IsMatch<Tree2KDLString, Tree2KDLString>;
let t2To2MatchJSX: IsMatch<Tree2JSXString, Tree2JSXString>;
let t2To2MatchHTML: IsMatch<Tree2HTMLString, Tree2HTMLString>;
