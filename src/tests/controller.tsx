import { h, createFragment, toJSON } from "@virtualstate/focus";

export interface Push<T> {
  next(value: T): void;
  value: T;
  done: boolean;
  name: "fragment";
  children: AsyncIterable<T>;
}

export function createPush<T>(value: T): Push<T> {
  let resolveNext: ((value?: T) => void)[] = [];
  let pending = false;
  let done = false;
  let object: Push<T>;
  object = {
    next(next) {
      value = next;
      if (!resolveNext.length) {
        pending = true;
      }
      for (const fn of resolveNext) {
        fn(value);
      }
      resolveNext = [];
    },
    get value() {
      return value;
    },
    set value(next: T) {
      value = next;
      object.next(next);
    },
    get done() {
      return done;
    },
    set done(next) {
      if (!next) return;
      done = next;
      object.next(value);
    },
    name: "fragment",
    children: {
      [Symbol.asyncIterator]: Push,
    },
  };
  return object;

  async function* Push() {
    let last = undefined;
    do {
      const promise = new Promise<T>((resolve) => resolveNext.push(resolve));
      if (pending) {
        object.next(value);
        pending = false;
      }
      await promise;
      if (done && last === value) {
        break;
      }
      yield value;
      last = value;
    } while (!done);
  }
}

function Controller() {
  const push = createPush([]);
  const name = createPush("");
  return (
    <>
      {push}
      <Run />
      Hello {name}
    </>
  );

  // A function running alongside an async iterable allows for both to co-exist without
  // relying on one finishing or not
  async function Run() {
    push.value = [1, 2, 3];
    name.value = "Wor";

    await new Promise((resolve) => setTimeout(resolve, 10));

    push.value = [4, 5, 6];
    name.value = "World!";

    name.done = true;
    push.done = true;
  }
}

let done = false;

async function d(): Promise<unknown> {
  await new Promise<void>((r) => setTimeout(r, 1));
  if (done) return;
  return d();
}
void d();

const main = (
  <result>
    <Controller />
  </result>
);

for await (const string of toJSON(main)) {
  console.log(string);
}

done = true;
