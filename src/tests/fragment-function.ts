import {children, isComponentFn, ok} from "@virtualstate/focus";

function IgnoreFunction() {
    throw new Error("Should not be invoked through reading");
}
ok(isComponentFn(IgnoreFunction));

Object.defineProperty(IgnoreFunction, Symbol.asyncIterator, {
    value: async function *() {
        yield 1;
        yield 2;
    }
});
ok(!isComponentFn(IgnoreFunction));

const [result] = await children(IgnoreFunction);
console.log({ result });
ok(result === 2);