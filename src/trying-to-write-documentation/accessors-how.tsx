import { ok, h } from "@virtualstate/focus";

let tree,
  node,
  object,
  snapshot,
  rawNode,
  api,
  proxied,
  nodeInstance,
  staticInstance: unknown;

/**
 * This is living documentation, change this code, and on build, README.md will be updated
 *
 * Comments starting with /* (and not /**) will be treated as markdown
 * Code is treated as codeblocks
 *
 * To split code up, add an empty comment
 * A comment must have its starting & ending markers on their own lines
 */

/*
# How to read JSX trees

# The actual JSX node

A single JSX node is something we can inspect directly without any additional resolution (that may require async)

This can tell us things like, what kind of node it is, for example through its tagName, type property, or some other
identifying property, this lets us tell forms from inputs, identify fragment nodes, or identify an associated class or
function's name.

## name

Through focus, you can use the `name` accessor
 */
const { name } = await import("@virtualstate/focus");

node = <named />;

ok(name(node) === "named");

/*
## properties

JSX nodes can have key value pairs associated to them, these can be used for attributes, options, or properties,
depending on what the node will be used for!

You can get an object with these values using the `properties` accessor
 */
const { properties } = await import("@virtualstate/focus");

node = <named key="value" type="text" />;
object = properties(node);

ok<object>(object);
ok(object.key === "value");
ok(object.type === "text");

/*
# Async + Other Accessors

## children

JSX nodes can have children nodes associated with them, this lets us create trees and graphs with JSX

Children may be resolvable completely synchronously, or async, either way, we use an async interface to our
JSX node's children to ensure a consistent API across all nodes, and allowing this
resolution to be freely swapped behind the scenes without changing dependent implementation.

One way we can read this tree is as if each node was a parent to some children, if we need to access
those same children's children, we just repeat the same process again, until we have explored the entire tree.

To access a JSX node's children, use the `children` accessor
 */
const { children } = await import("@virtualstate/focus");

tree = (
  <parent>
    <first />
    <second />
  </parent>
);

snapshot = await children(tree);

ok<Array<unknown>>(Array.isArray(snapshot));

ok(name(snapshot[0]) === "first");
ok(name(snapshot[1]) === "second");

/*
Sometimes a JSX node may have multiple representations of what it's child state looks like,
instead of using `await` with the result of `children`, we can instead use `for await`

This may be useful where there is some delay in one of the child node's from resolving
 */

async function Component() {
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  return <second />;
}

tree = (
  <parent>
    <first />
    <Component />
  </parent>
);

for await (snapshot of children(tree)) {
  ok(name(snapshot[0]) === "first");
  ok(!snapshot[1] || name(snapshot[1]) === "second");
}

/*
## childrenSettled

Some children may also throw errors, meaning you may want some way to observe the state of each individual
child node, using children that are fulfilled, and deciding what to do with children that rejected

For this you can use the `childrenSettled` accessor, this has both the `await` and `for await` functionality
like `children`
 */
const { childrenSettled } = await import("@virtualstate/focus");

async function ComponentThrows() {
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  throw new Error("Some error!");
}

tree = (
  <parent>
    <first />
    <ComponentThrows />
  </parent>
);

snapshot = await childrenSettled(tree);
ok(snapshot[0].status === "fulfilled");
ok(snapshot[1].status === "rejected");

/*
 */

for await (snapshot of childrenSettled(tree)) {
  ok(snapshot[0].status === "fulfilled");
  ok(!snapshot[1] || snapshot[1].status === "rejected");
}

/*
## descendants

Instead of just the direct children of a single JSX node, you may want to find out all descendants that you can reach

For this, you can use the `descendants` accessor
 */
const { descendants } = await import("@virtualstate/focus");

tree = (
  <parent>
    <first />
    <second>
      <third />
    </second>
  </parent>
);
snapshot = await descendants(tree);
ok(name(snapshot[0]) === "first");
ok(name(snapshot[1]) === "second");
ok(name(snapshot[2]) === "third");

/*
As with `children`, `descendants` to can be accessed through `for await`
 */

for await (snapshot of descendants(tree)) {
  ok(name(snapshot[0]) === "first");
  ok(name(snapshot[1]) === "second");
  ok(!snapshot[2] || name(snapshot[2]) === "third");
}

/*
## descendantsSettled

You may want to be able to observe the resolution state of all descendants, as with `childrenSettled`

For this you can use the `descendantsSettled` accessor
 */
const { descendantsSettled } = await import("@virtualstate/focus");

tree = (
  <parent>
    <first />
    <second>
      <ComponentThrows />
    </second>
  </parent>
);

snapshot = await descendantsSettled(tree);
ok(snapshot[0].status === "fulfilled");
ok(snapshot[1].status === "fulfilled");
ok(snapshot[2].status === "rejected");

/*
 */

for await (snapshot of descendantsSettled(tree)) {
  ok(snapshot[0].status === "fulfilled");
  ok(snapshot[1].status === "fulfilled");
  ok(!snapshot[2] || snapshot[2].status === "rejected");
}

/*
Because we can expose a bit more information with `descendantsSettled`, you can also
access the parent of an individual status object.

This is helpful when re-creating a tree from these descendants, or creating associations between them.
 */

snapshot = await descendantsSettled(tree);
ok(snapshot[1].status === "fulfilled");
ok(snapshot[2].parent === snapshot[1].value);

/*
This can also be accessed using through the `for await` pattern:
 */

for await (snapshot of descendantsSettled(tree)) {
  ok(snapshot[1].status === "fulfilled");
  ok(!snapshot[2] || snapshot[2].parent === snapshot[1].value);
}

/*
## raw

The value you have access to, returned from the JSX node creation process, may not be the original representation
used for the JSX node. This original raw representation may be helpful when creating new accessor functions, or
what to inspect source definitions of component functions.

If there is another representation available, the `raw` accessor can be used to access it, if there
is no raw representation, then that means the passed node is a raw representation itself, which is returned by default.
 */
const { raw } = await import("@virtualstate/focus");

node = <named />;
rawNode = raw(node);
ok(name(rawNode) === "named");

/*
## proxy

To provide a new interface for a JSX node, or provide a different object completely, while still providing support
for the above JSX accessors, the `proxy` function can be used
 */
const { proxy } = await import("@virtualstate/focus");

node = <named />;

api = { name };
proxied = proxy(node, api);
ok(proxied.name === "named");

/*
 */

api = { someAccessorName: name };
proxied = proxy(node, api);
ok(proxied.someAccessorName === "named");

/*
If a `instance` accessor is provided, then this can be used to provide a new object completely
 */

api = {
  instance() {
    return { name: Math.random(), source: Math.random() };
  },
};
proxied = proxy(node, api);

ok(typeof proxied.name === "number");
ok(typeof proxied.source === "number");
ok(name(proxied) === "named");

/*
When instance is used, `raw` becomes useful:
 */

rawNode = raw(proxied);
ok(name(rawNode) === "named");
ok(typeof rawNode.name !== "number");
ok(rawNode === raw(node));

/*
If you need to access the original instance that is being proxied, you can use
the `instance` accessor.
 */
const { instance } = await import("@virtualstate/focus");

staticInstance = { something: 1 };
api = {
  instance() {
    return staticInstance;
  },
};
proxied = proxy(node, api);
nodeInstance = instance(proxied);
ok(typeof proxied.something === "number");
ok(nodeInstance === staticInstance);
ok(nodeInstance !== proxied);

export default 1;
