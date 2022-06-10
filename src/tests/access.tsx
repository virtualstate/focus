import { getters, h, h as proxyH } from "../proxy-h";
import { h as staticH } from "../static-h";
import { stack } from "../stack";
import {
  children,
  childrenSettled,
  descendants,
  descendantsSettled,
} from "../children";
import { proxy } from "../access";
import { all } from "@virtualstate/promise";
import { anAsyncThing } from "@virtualstate/promise/the-thing";
import { isNode } from "../like";
import {childrenSync, descendantsSync} from "@virtualstate/focus";

const multiTree = {
  source: "name",
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

console.log([...childrenSync(multiTree)]);
console.log([...childrenSync(multiTree)].map(node => [...childrenSync(node)]));
console.log([...descendantsSync(multiTree)]);

console.log(await stack(multiTree));

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
