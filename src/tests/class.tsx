import {
  assertUnknownJSXNode,
  descendants,
  h,
  instance,
  ok,
  properties,
} from "@virtualstate/focus";

class Hey {
  constructor({ hey }: { hey: string }, public children?: unknown) {
    console.log({ hey });
  }

  hey(hey: unknown) {
    return `hey ${hey}`;
  }
}

const hey: Hey = <Hey hey="aye" />;

console.log(properties(hey)["hey"]);
console.log(hey.hey("ney"));

let CLASS_INSTANCE = 0;

class Class {
  instance: number;

  constructor(private props: Record<string, unknown>, public input?: unknown) {
    this.instance = CLASS_INSTANCE += 1;
  }

  a() {
    return 1;
  }

  b(input: string) {
    return `Hello ${input}`;
  }

  c() {
    return `a: ${this.props["a"] ?? ""} b: ${this.props["b"] ?? ""}`;
  }

  // async *[Symbol.asyncIterator]() {
  //     console.log(await descendants(this.input));
  //     yield (
  //         <wrapper>
  //             {this.input}
  //         </wrapper>
  //     );
  // }
}

const node: Class = <Class a="initial">Initial Input</Class>;

ok(node.a);
ok(typeof node.a === "function");
ok(typeof node.b === "function");
ok(typeof node.c === "function");

console.log(node.c());

const Node: any = node;
const newNode: Class = <Node b="new" />;

console.log({ node });
console.log({ newNode });
console.log(properties(node));
console.log(properties(newNode));

console.log(newNode.b("world"));
console.log(newNode.c());

console.log({ nodeDescendants: await descendants(node) });
console.log({ newNodeDescendants: await descendants(newNode) });

const NewNode: any = newNode;
const nextNode: Class = <NewNode c="next">Next Input</NewNode>;

console.log({ nextNodeDescendants: await descendants(nextNode) });

assertUnknownJSXNode(nextNode);

// console.log(nextNode[Symbol.for("@virtualstate/focus/instance")], instance(nextNode));

ok(instance(nextNode) === nextNode[Symbol.for("@virtualstate/focus/instance")]);
