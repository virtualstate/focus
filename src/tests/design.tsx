import {
  children,
  name,
  h as f,
  createFragment as ff,
  properties,
  design,
  ok,
  descendantsSettled,
  isFragment,
  descendants,
  logDescendantsSettled,
  logDescendantsSettledFromPromise,
  isUnknownJSXNode,
} from "@virtualstate/focus";

let h: unknown = f,
    createFragment: unknown = ff

{
  h = f;

  async function Parent(options: unknown, input?: unknown) {
    const snapshot = children(input);
    const {
      a: [a, a2],
      b: [b],
      c: [c],
    } = snapshot.group(name);

    const two = properties(await a).value;
    const three = properties(await b).value;

    console.log({ two, three });

    ok(two === 2, "Expected two");
    ok(three === 3, "Expected three");

    const four = properties(await c).value;
    const two2 = properties(await a2).value;
    console.log({ four, two2 });

    ok(!four || four === 4, "Expected four");
    ok(!two2 || two2 === 2, "Expected two");

    const { number } = snapshot
      .map(properties)
      .map((props) => props.value)
      .group((value) => typeof value);

    const [first, second] = await number;

    console.log({ first, second });

    ok(typeof first === "number");
    ok(typeof second === "number");

    return (
      two +
      three +
      (typeof four === "number" ? four : 0) +
      (typeof two2 === "number" ? two2 : 0)
    );
  }

  const designer = design();

  const root = designer.add(Parent);

  root.add(<a value={2} />);
  root.add(<b value={3} />);

  let [result] = await children(designer);
  console.log({ result });
  ok(result === 5);

  const c = <c value={4} />;
  root.add(c);

  [result] = await children(designer);
  console.log({ result });
  ok(result === 9);

  root.delete(c);

  [result] = await children(designer);
  console.log({ result });
  ok(result === 5);

  root.clear();

  let error = await children(designer).catch((error) => error);
  console.log({ error });

  ok(error instanceof Error, "expected error to be returned");

  root.add(<a value={3} />);
  root.add(<b value={4} />);
  root.add(<c value={5} />);

  error = await children(designer).catch((error) => error);
  console.log({ error });
  ok(error instanceof Error, "expected error to be returned");

  root.clear();

  root.add(<a value={2} />);
  root.add(<b value={3} />);
  root.add(c);

  [result] = await children(designer);
  console.log({ result });
  ok(result === 9);

  root.add(<a value={2} />);

  [result] = await children(designer);
  console.log({ result });
  ok(result === 11);
}

{
  h = f;
  type Props = Record<string, unknown>;

  async function Node(props: Props, input?: unknown) {
    return <node {...props}>{input}</node>;
  }

  async function Edge(props: Props, input?: unknown) {
    return <edge {...props}>{input}</edge>;
  }

  const root = design({ });

  ok(isFragment(root));

  const a = root.add(Node, { name: "a" });
  const aEdge1 = a.add(Edge, { name: "a" });

  const b = root.add(Node, { name: "b" });
  const bEdge1 = b.add(Edge, { name: "b" });

  const c = root.add(Node, { name: "c" });
  const cEdge1 = c.add(Edge, { name: "c" });

  const d = root.add(Node, { name: "d" });
  const dEdge1 = d.add(Edge, { name: "d" });

  const e = root.add(Node, { name: "e" });
  const eEdge1 = e.add(Edge, { name: "e" });

  async function Random(props: Props, input?: unknown) {
    const snapshot = await children(input);
    const index = Math.round(Math.random() * (snapshot.length - 1));
    return snapshot[index];
  }

  const swap = root.add(Random);

  swap.add(a);
  swap.add(b);
  swap.add(d);

  aEdge1.add(b);
  bEdge1.add(c);
  cEdge1.add(d);
  dEdge1.add(e);
  eEdge1.add(swap);
  eEdge1.add(a);

  // const log: string[] = [];

  const TARGET = 10;

  await logDescendantsSettledFromPromise(descendantsSettled(root).take(TARGET));
}

{
  h = f;
  createFragment = ff;

  ({ h, createFragment } = design());

  const b = <b value={2} />;

  const parent = (
    <parent>
      <a value={1} />
      {b}
    </parent>
  );

  ({ h, createFragment } = parent);

  const c = <c value={3} />;
  const d = <d value={4} />;

  let names = await descendants(parent).map(name);

  console.log({ names });

  ok(names.includes("parent"));
  ok(names.includes("a"));
  ok(names.includes("b"));
  ok(names.includes("c"));
  ok(names.includes("d"));

  parent.delete(c);

  names = await descendants(parent).map(name);

  console.log({ names });

  ok(names.includes("parent"));
  ok(names.includes("a"));
  ok(names.includes("b"));
  ok(!names.includes("c"));
  ok(names.includes("d"));

  parent.delete(d);

  names = await descendants(parent).map(name);

  console.log({ names });

  ok(names.includes("parent"));
  ok(names.includes("a"));
  ok(names.includes("b"));
  ok(!names.includes("c"));
  ok(!names.includes("d"));

  parent.add(c);

  names = await descendants(parent).map(name);

  console.log({ names });

  ok(names.includes("parent"));
  ok(names.includes("a"));
  ok(names.includes("b"));
  ok(names.includes("c"));
  ok(!names.includes("d"));

  parent.clear();

  names = await descendants(parent).map(name);

  console.log({ names });

  ok(names.includes("parent"));
  ok(names.length === 1);

  parent.add(b);

  names = await descendants(parent).map(name);

  console.log({ names });

  ok(names.includes("parent"));
  ok(names.includes("b"));
  ok(names.length === 2);

  <>
    {1}
    {2}
    {3}
  </>;

  let values = await descendants(parent);

  console.log({ values });

  ok(name(values[0]) === "parent");
  ok(name(values[1]) === "b");
  ok(values.includes(1));
  ok(values.includes(2));
  ok(values.includes(3));
  ok(values.length === 5);


  h = f;
  createFragment = ff;
}

{

  const root = design({
    async: true
  });

  async function watching() {
    console.log("watching");
    const seen = new Set();
    for await (const snapshot of children(root)) {
      console.log({ snapshot });
      ok(Array.isArray(snapshot));
      for (const value of snapshot) {
        seen.add(value);
      }
    }
    console.log({ seen });
    const nodes = [...seen]
        .filter(isUnknownJSXNode)
        .map(name);
    ok(seen.size === 5);
    ok(nodes.includes("a"));
    ok(nodes.includes("b"));
    ok(seen.has(1));
    ok(seen.has(2));
    ok(seen.has(3));
    return seen;
  }

  const promise = watching();

  ({ h, createFragment } = root);

  <a />;
  <b />;

  <>
    {1}
    {2}
    {3}
  </>;

  root.close();
  console.log("waiting");
  await promise;

  h = f;
  createFragment = ff;

}


{


  const root = design();

  ({ h, createFragment } = root);

  const a = <a />;
  const b = <b />;
  const c = <c />;

  const d = root.set(a, "d");

  let snapshot = await children(root);
  let names = snapshot.map(name);

  console.log({ snapshot, names });

  ok(names.includes("d"));
  ok(names.includes("b"));
  ok(names.includes("c"));

  root.set(d, a);

  snapshot = await children(root);
  names = snapshot.map(name);

  console.log({ snapshot, names });

  ok(names.includes("a"));
  ok(names.includes("b"));
  ok(names.includes("c"));

  h = f;
  createFragment = ff;

  const fragment = root.set(a,
      <>
        This is an independent fragment
      </>
  );

  snapshot = await children(root);
  names = snapshot.map(name);

  console.log({ snapshot, names });

  ok(snapshot.includes("This is an independent fragment"))
  ok(names.includes("b"));
  ok(names.includes("c"));

  root.delete(fragment);

  snapshot = await children(root);
  names = snapshot.map(name);

  console.log({ snapshot, names });

  ok(snapshot.length === 2);
  ok(names.length === 2);
  ok(names.includes("b"));
  ok(names.includes("c"));

  // Can't set a from this point because it was deleted
  // Must use add, which will add to the end of the list
  // The reference was just lost

  root.add(a);

  snapshot = await children(root);
  names = snapshot.map(name);

  console.log({ snapshot, names });
  ok(snapshot.length === 3);
  ok(names.length === 3);
  ok(names.includes("b"));
  ok(names.includes("c"));
  ok(names.includes("a"));
  ok(names[2] === "a");

  const random = Math.random();

  function asA() {
    let { createFragment, h } = root.get(a);
    <>
      {1}
    </>;
    <>
      {2}
    </>;
    <>
      {3}
      {4}
    </>;
    <>
      {random}
    </>
  }

  asA();

  snapshot = await children(root);
  names = snapshot.map(name);

  console.log({ snapshot, names });

  ok(root.get(a));
  ok(snapshot.includes(1));
  ok(snapshot.includes(2));
  ok(snapshot.includes(3));
  ok(snapshot.includes(4));
  ok(snapshot.includes(random));

  h = f;
  createFragment = ff;
}