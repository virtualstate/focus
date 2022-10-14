import { h, toString } from "@virtualstate/focus";

const tree = {
  source: "main" as const,
  children: [
    1,
    "a" as const,
    {
      name: "child1" as const,
      props: {
        prop: "something",
        another: 1,
        boolean: true,
        false: false,
        symbol: Symbol("Symbol Name")
      },
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
    <child3 prop="something" />
  ],
} as const;

console.log(await toString(tree, { space: "  " }));

for await (const string of toString(tree, { space: " " })) {
  console.log(string);
}

console.log(await toString(tree, {
  space: "  ",
  replacer(key, value) {
    if (typeof value === "boolean") {
      return value ? key : undefined;
    }
    return value;
  }
}))