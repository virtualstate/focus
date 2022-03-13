import { children, childrenSettled } from "../children";
import { proxy } from "../access";
import { getters } from "../proxy-h";

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
        },
      },
    },
    {
      name: "child2",
      children: {
        *[Symbol.iterator]() {
          yield 2 as const;
          yield 3 as const;
        },
      },
    },
    {
      name: "fragment",
      children: [55, 56],
    },
  ],
} as const;

let a: 1 | undefined, fiftyFive: 55 | undefined, fiftySix: 56 | undefined;

[a, , , , fiftyFive, fiftySix] = await children(tree);

console.log({ a, fiftyFive, fiftySix });
a = undefined;
fiftyFive = undefined;
fiftySix = undefined;

const treeProxied = proxy(tree, getters);

[a, , , , fiftyFive, fiftySix] = await children(treeProxied);
console.log({ a, fiftyFive, fiftySix });
a = undefined;
fiftyFive = undefined;
fiftySix = undefined;

const [aSettled, , , , fiftyFiveSettled, fiftySixSettled] =
  await childrenSettled(treeProxied);

if (aSettled.status === "fulfilled") {
  a = aSettled.value;
}
if (fiftyFiveSettled.status === "fulfilled") {
  fiftyFive = fiftyFiveSettled.value;
}
if (fiftySixSettled.status === "fulfilled") {
  fiftySix = fiftySixSettled.value;
}

console.log({ a, fiftyFive, fiftySix });
a = undefined;
fiftyFive = undefined;
fiftySix = undefined;

//
// type N = RawNodeValue<typeof treeProxied>;
//
type C = typeof treeProxied.children;
//
const proxiedChildren = await treeProxied.children;
//
// [a,,,,fiftyFive] = proxiedChildren;
// console.log({ a, fiftyFive });

const smallTree = {
  source: "main",
  children: [1],
} as const;
const smallTreeProxied = proxy(smallTree, getters);
//
type SC = typeof smallTreeProxied.children;
//
const smallTreeChildren = await smallTreeProxied.children;
// [a] = smallTreeChildren;

export default 1;
