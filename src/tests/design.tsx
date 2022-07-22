import {children, name, h, properties, design, ok} from "@virtualstate/focus";
import {split} from "@virtualstate/promise";

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



