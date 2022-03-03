import {children} from "../children";
import {ChildrenArray, ChildrenOfNode} from "../children-output";
import {proxy, RawNodeValue} from "../access";
import {getters} from "../proxy-h";

const tree = {
    source: "main",
    children: [
        1,
        "a",
        {
            name: "child1",
            children: {
                async *[Symbol.asyncIterator]() {
                    yield 1 as const;
                }
            }
        },
        {
            name: "child2",
            children: {
                *[Symbol.iterator]() {
                    yield 2 as const;
                    yield 3 as const;
                }
            }
        },
        {
            name: "fragment",
            children: [55, 56]
        }
    ]
} as const

let a: 1,
    fiftyFive: 55,
    fiftySix: 56;

[a,,,,fiftyFive, fiftySix] = await children(tree);

console.log({ a, fiftyFive, fiftySix });

// const treeProxied = proxy(tree, getters);
//
// type N = RawNodeValue<typeof treeProxied>;
//
// type C = typeof treeProxied.children;
//
// const proxiedChildren = await treeProxied.children;
//
// [a,,,,fiftyFive] = proxiedChildren;
// console.log({ a, fiftyFive });


// const smallTree = {
//     source: "main",
//     children: [
//         1,
//     ]
// } as const;
// const smallTreeProxied = proxy(smallTree, getters);
//
// type SC = typeof smallTreeProxied.children;
//
// const smallTreeChildren = await smallTreeProxied.children;
// [a] = smallTreeChildren;

export default 1;