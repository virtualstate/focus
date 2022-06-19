import {children, ok} from "@virtualstate/focus";

const arrayInput = Math.random();
const array = await children([
    arrayInput
]);
console.log(array);
ok(array.length === 1);
ok(array[0] === arrayInput);

const arrayPromiseInput = Math.random();
const arrayPromise = await children([
    Promise.resolve(arrayPromiseInput)
]);
console.log(arrayPromise);
ok(arrayPromise.length === 1);
ok(arrayPromise[0] === arrayPromiseInput);


const arrayAsyncIterableInput = Math.random();
const arrayAsyncIterable = await children([
    {
        async *[Symbol.asyncIterator]() {
            yield arrayAsyncIterableInput;
        }
    }
]);
console.log(arrayAsyncIterable);
ok(arrayAsyncIterable.length === 1);
ok(arrayAsyncIterable[0] === arrayAsyncIterableInput);

const arrayAsyncIterablePromiseInput = Math.random();
const arrayAsyncIterablePromise = await children([
    {
        async *[Symbol.asyncIterator]() {
            yield [Promise.resolve(arrayAsyncIterablePromiseInput)];
        }
    }
]);
console.log(arrayAsyncIterablePromise);
ok(arrayAsyncIterablePromise.length === 1);
ok(arrayAsyncIterablePromise[0] === arrayAsyncIterablePromiseInput);




const asyncIterableInput = Math.random();
const asyncIterable = await children({
    async *[Symbol.asyncIterator]() {
        yield asyncIterableInput;
    }
});
console.log(asyncIterable);
ok(asyncIterable.length === 1);
ok(asyncIterable[0] === asyncIterableInput);

const asyncIterablePromiseInput = Math.random();
const asyncIterablePromise = await children({
    async *[Symbol.asyncIterator]() {
        yield [Promise.resolve(asyncIterablePromiseInput)];
    }
});
console.log(asyncIterablePromise);
ok(asyncIterablePromise.length === 1);
ok(asyncIterablePromise[0] === asyncIterablePromiseInput);

const asyncIterablePromiseArrayInput = Math.random();
const asyncIterablePromiseArray = await children({
    async *[Symbol.asyncIterator]() {
        yield [Promise.resolve([asyncIterablePromiseArrayInput])];
    }
});
console.log(asyncIterablePromiseArray);
ok(asyncIterablePromiseArray.length === 1);
ok(asyncIterablePromiseArray[0] === asyncIterablePromiseArrayInput);