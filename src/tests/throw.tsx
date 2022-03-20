import {childrenSettled, h} from "@virtualstate/focus";
import {all} from "@virtualstate/promise";

async function Throw1() {
    throw new Error();
}
async function Throw2() {
    await new Promise<void>(queueMicrotask);
    throw new Error();
}
async function *Throw3() {
    await new Promise<void>(queueMicrotask);
    throw new Error();
}
async function *Throw4() {
    yield 1;
    await new Promise<void>(queueMicrotask);
    yield 2;
    throw new Error();
}
async function *Throw5() {
    yield 1;
    yield 2;
    await new Promise<void>(queueMicrotask);
    throw new Error();
}
async function *Throw6() {
    yield 1;
    yield 2;
    await new Promise<void>(queueMicrotask);
    yield Promise.reject();
}
async function *Throw7() {
    yield 1;
    yield 2;
    await new Promise<void>(queueMicrotask);
    await Promise.reject();
}

const results = await all(
    [
        <Throw1 />,
        <Throw2 />,
        <Throw3 />,
        <Throw4 />,
        <Throw5 />,
        <Throw6 />,
        <Throw7 />,
        <parent>
            <child1 />
            <Throw1 />
        </parent>
    ].map(node => childrenSettled(node))
);

console.log(results);

export default 1;