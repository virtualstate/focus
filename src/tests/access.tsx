import { getters, h, h as proxyH } from "../proxy-h";
import { h as staticH } from "../static-h";
import {
  children,
  childrenSettled,
  descendants,
  descendantsSettled,
} from "../children";
import {name, properties, proxy} from "../access";
import { all } from "@virtualstate/promise";
import { anAsyncThing } from "@virtualstate/promise/the-thing";
import { isNode, ok } from "../like";
import {
  childrenSync,
  descendantsSettledSync,
  descendantsSync,
} from "@virtualstate/focus";
import { isIterable } from "../is";

const multiTree = {
  source: "body",
  options: {
    attribute: "value",
    value: 1,
  },
  children: [
    {
      type: "main",
      children: [
        {
          $$type: "section",
          props: {
            id: "main-section",
          },
          children: {
            async *[Symbol.asyncIterator]() {
              yield [
                {
                  type: "h1",
                  children: ["hello", "world"],
                },
                "whats up",
              ];
            },
          },
        },
        <footer id="foot">Footer content</footer>,
        proxyH("test-proxy", { id: "test-proxy" }, "test"),
        staticH("test-static", { id: "test-static" }, "test"),
        staticH(
          async function* Component(props: unknown) {
            yield `component 1 ${JSON.stringify({ props })}`;
          },
          { id: "component" }
        ),
      ],
    },
  ],
};

export async function accessors(multiTree: unknown) {
  const childrenSyncIterable = childrenSync(multiTree);
  ok(isIterable(childrenSyncIterable));
  console.log([...childrenSyncIterable]);
  console.log([...(await childrenSync(multiTree))]);
  console.log([...(await children(multiTree))]);
  console.log(
      [...childrenSyncIterable].reduce((all: unknown[], node) => {
        const nodeChildren = childrenSync(node);
        ok(isIterable(nodeChildren));
        return [...all, ...nodeChildren];
      }, [])
  );
  console.log(
      await [...(await childrenSync(multiTree))].reduce(
          (all: Promise<unknown[]>, node) => {
            return all.then(async (all) => {
              return [...all, ...(await childrenSync(node))];
            });
          },
          Promise.resolve([])
      )
  );
  console.log(
      await [...(await children(multiTree))].reduce(
          (all: Promise<unknown[]>, node) => {
            return all.then(async (all) => {
              return [...all, ...(await children(node))];
            });
          },
          Promise.resolve([])
      )
  );
  const descendantsSyncIterable = descendantsSync(multiTree);
  ok(isIterable(descendantsSyncIterable));
  console.log([...descendantsSyncIterable]);
  console.log([...(await descendantsSync(multiTree))]);
  console.log([...(await descendants(multiTree))]);
  const descendantsSettledSyncIterable = descendantsSettledSync(multiTree);
  ok(isIterable(descendantsSettledSyncIterable));
  console.log([...descendantsSettledSyncIterable]);
  console.log([...(await descendantsSettledSync(multiTree))]);
  console.log([...(await descendantsSettled(multiTree))]);

  console.log("for await");
  for await (const snapshot of childrenSync(multiTree)) {
    console.log([...snapshot]);
    console.log(Object.fromEntries([...snapshot].map(node => [name(node), properties(node)])));
  }
  for await (const snapshot of children(multiTree)) {
    console.log([...snapshot]);
    console.log(Object.fromEntries([...snapshot].map(node => [name(node), properties(node)])));
  }
  for await (const snapshot of descendantsSync(multiTree)) {
    console.log([...snapshot]);
    console.log(Object.fromEntries([...snapshot].map(node => [name(node), properties(node)])));
  }
  for await (const snapshot of descendants(multiTree)) {
    console.log([...snapshot]);
    console.log(Object.fromEntries([...snapshot].map(node => [name(node), properties(node)])));
  }
  for await (const snapshot of descendantsSettledSync(multiTree)) {
    console.log([...snapshot]);
  }
  for await (const snapshot of descendantsSettled(multiTree)) {
    console.log([...snapshot]);
  }
}

await accessors(multiTree);

console.log(await children(multiTree));

const [child] = await children(multiTree);
console.log({ child });

console.log(await descendants(multiTree));
console.log(await descendantsSettled(multiTree));

console.log(
  await childrenSettled({
    children: [
      {
        name: "fragment",
        children: {
          async *[Symbol.asyncIterator]() {
            yield 1;
            throw new Error("1");
          },
        },
      },
      2,
    ],
  })
);
console.log(
  await descendantsSettled({
    children: [
      {
        name: "fragment",
        children: {
          async *[Symbol.asyncIterator]() {
            yield 1;
            throw new Error("1");
          },
        },
      },
      2,
      {
        name: "fragment",
        children: {
          async *[Symbol.asyncIterator]() {
            yield 3;
            yield {
              name: "main",
              children: {
                async *[Symbol.asyncIterator]() {
                  throw new Error("3");
                },
              },
            };
          },
        },
      },
    ],
  })
);

const context = { getters, proxy };

const multiTreeProxy = proxy(multiTree, getters, context);
const multiTreeDescendants = await multiTreeProxy.descendants;
const proxied = multiTreeDescendants.filter<typeof multiTreeProxy>(isNode);
const components = proxied
  .filter((node) => node.component)
  .map((node) => node.component);
console.log({
  proxied: proxied.map((node) => [
    node.name,
    ...Object.entries(node[Symbol.for(":kdl/props")]).flatMap((value) => value),
  ]),
  components,
  componentsValues: await all(components.map(anAsyncThing)),
});

console.log(multiTreeDescendants);
console.log(await multiTreeProxy.descendantsSettled);
console.log(await multiTreeProxy.children);
const [main] = await multiTreeProxy.children;
console.log({ main });
const mainProxy = proxy(main, getters);
const mainChildren = await mainProxy.children;
console.log({ mainChildren });
const mainChildrenSettled = await mainProxy.childrenSettled;
console.log({ mainChildrenSettled });
console.log({ mainName: mainProxy.name });
const [section] = mainChildren;
const sectionProxy = proxy(section);
const sectionProps: Record<string | symbol, unknown> = sectionProxy.props;
const sectionPropsSymbol: Record<string | symbol, unknown> =
  sectionProxy.options;
console.log({ sectionProps });
console.log({ sectionPropsSymbol });

export default 1;
