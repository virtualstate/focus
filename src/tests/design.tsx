import {children, name, h, properties, design, ok} from "@virtualstate/focus";
import {split} from "@virtualstate/promise";

async function Parent(options: unknown, input?: unknown) {

    const {
        a: [a], b: [b], c: [c]
    } = split(
        children(input)
    )
        .group(name)


    const two = properties(await a).value;
    const three = properties(await b).value;
    const four = properties(await c).value;

    console.log({ two, three, four });

    ok(two === 2);
    ok(three === 3);
    ok(!four || four === 4);

    return two + three + (typeof four === "number" ? four : 0);
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

const error = await children(designer).catch(error => error);

ok(error instanceof Error, "expected error to be returned");

root.add(<a value={3} />);
root.add(<b value={4} />);
root.add(<c value={5} />);

const errorNumbers = await children(designer).catch(error => error);

ok(errorNumbers instanceof Error, "expected error to be returned");

root.clear();

root.add(<a value={2} />);
root.add(<b value={3} />);
root.add(c);

[result] = await children(designer);
console.log({ result });
ok(result === 9);


