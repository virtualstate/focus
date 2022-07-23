import {
    children,
    name,
    h as f,
    properties,
    design,
    ok,
    descendantsSettled,
    isFragment,
    descendants,
    logDescendantsSettled, logDescendantsSettledFromPromise
} from "@virtualstate/focus";
import {split} from "@virtualstate/promise";


let h: unknown = f;

{
    h = f;

    async function Parent(options: unknown, input?: unknown) {

        const {
            a: [a, a2], b: [b], c: [c]
        } = split(
            children(input)
        )
            .group(name)


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

    let error = await children(designer).catch(error => error);
    console.log({ error });

    ok(error instanceof Error, "expected error to be returned");

    root.add(<a value={3} />);
    root.add(<b value={4} />);
    root.add(<c value={5} />);

    error = await children(designer).catch(error => error);
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
        return <node {...props}>{input}</node>
    }

    async function Edge(props: Props, input?: unknown) {
        return <edge {...props}>{input}</edge>
    }

    const root = design(Node, { name: "root" });

    ok(isFragment(root));

    const a = root.add(Node, { name: "a" })
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
        const snapshot = await children(input)
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

    await logDescendantsSettledFromPromise(
        split(
            descendantsSettled(root)
        ).take(TARGET)
    );

}

{
    h = f;

    h = design().add

    const b = <b value={2} />;

    const parent = (
        <parent>
            <a value={1} />
            {b}
        </parent>
    )

    console.log({ parent });

    h = parent.add;

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
    ok(!names.includes("d"))

    parent.add(c);

    names = await descendants(parent).map(name);

    console.log({ names });

    ok(names.includes("parent"));
    ok(names.includes("a"));
    ok(names.includes("b"));
    ok(names.includes("c"));
    ok(!names.includes("d"))

    parent.clear();

    names = await descendants(parent).map(name)

    console.log({ names });

    ok(names.includes("parent"));
    ok(names.length === 1);


    parent.add(b);


    names = await descendants(parent).map(name)

    console.log({ names });

    ok(names.includes("parent"));
    ok(names.includes("b"));
    ok(names.length === 2);







    h = f;
}