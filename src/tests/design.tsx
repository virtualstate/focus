import {
    children,
    name,
    h,
    properties,
    design,
    ok,
    descendantsSettled,
    isDescendantFulfilled,
    isFragment,
    getChildrenFromRawNode,
    getValueOrChildrenFromRawNode,
    isUnknownJSXNode
} from "@virtualstate/focus";
import {split} from "@virtualstate/promise";

{

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
    type Props = Record<string, unknown>;

    async function Node(props: Props, input?: unknown) {
        return <node {...props}>{input}</node>
    }

    async function Edge(props: Props, input?: unknown) {
        return <edge {...props}>{input}</edge>
    }

    const root = design(Node);

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

    aEdge1.add(e);
    bEdge1.add(d);
    cEdge1.add(c);
    dEdge1.add(b);
    eEdge1.add(swap);

    let count = 0;

    const log: string[] = [];

    const TARGET = 100;

    for await (const snapshot of descendantsSettled(root)) {
        for (const state of snapshot) {
            if (!isDescendantFulfilled(state)) {
                console.log({ count, state });
                break;
            }
            // const { parent, value } = state;
            // console.log(`${isFragment(parent) ? ":" : String(name(parent))} > ${String(name(value))}`, properties(value));
            await new Promise<void>(queueMicrotask);
            // console.log(`isFragment: ${isFragment(value)}`);
            // console.log(`name: ${String(name(value))}`);
            // console.log("Children:", getChildrenFromRawNode(value));
            // console.log("Raw Children:", isUnknownJSXNode(value) ? getValueOrChildrenFromRawNode(value) : undefined);
            // console.log(value);
        }


        count += 1;

        if (count > TARGET) {
            break;
        }
    }

    console.log(log.join("\n"));
    ok(count > TARGET);

}