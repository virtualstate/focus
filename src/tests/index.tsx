import { h } from "../static-h";
import {
  isFragment,
  isUnknownJSXNode,
  toGenericNode,
  UnknownJSXNode,
} from "../";
import { isAsyncIterable, isIterable } from "../is";
import { anAsyncThing } from "@virtualstate/promise/the-thing";
import {stack} from "../stack";
import {children, childrenSettled, descendants, descendantsSettled} from "../children";

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
      ],
    },
  ],
};


console.log(await stack(multiTree));

console.log(await children(multiTree));

console.log(await descendants(multiTree));
console.log(await descendantsSettled(multiTree));

console.log(await childrenSettled({
  children: [
    {
      name: "fragment",
      children: {
        async *[Symbol.asyncIterator]() {
          yield 1;
          throw new Error("1");
        }
      }
    },
    2
  ]
}))
console.log(await descendantsSettled({
  children: [
    {
      name: "fragment",
      children: {
        async *[Symbol.asyncIterator]() {
          yield 1;
          throw new Error("1");
        }
      }
    },
    2
  ]
}))