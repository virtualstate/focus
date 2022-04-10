import {h, children, getChildrenFromRawNode, ok, isUnknownJSXNode, name} from "@virtualstate/focus";

async function *Match(options?: unknown, input?: unknown) {
    ok(isUnknownJSXNode(input));
    // This is an enforced static fragment with defined children, aka <Match>{undefined}</Match> must have been used at
    // the minimum
    const childrenFromRawNode = getChildrenFromRawNode(input);
    ok(Array.isArray(childrenFromRawNode), "Expected static fragment");
    const [generator, ...outputs] = childrenFromRawNode;
    for await (const snapshot of children(generator)) {
        // Note direct reference for demo
        const output = snapshot.filter(value => outputs.includes(value));
        // console.log({ snapshot, outputs, output });
        if (output.length) {
            yield output;
        }
    }
}

const a = <a />
const b = <b />
const c = <c />

async function *Generator() {
    yield a;
    yield b;
    yield [a, b];
    yield [a, b, c];
}

for await (const snapshot of children(
    <Match>
       <Generator />
        {a}
        {b}
        {c}
    </Match>
)) {
    console.log({ snapshot: snapshot.map(name) });
}