import { h, createFragment, toJSON } from "@virtualstate/focus";
import { Push } from "@virtualstate/promise";

function Controller() {
  const push = new Push();
  const name = new Push();
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
    push.push([1, 2, 3]);
    name.push("Wor");

    await new Promise((resolve) => setTimeout(resolve, 10));

    push.push([4, 5, 6]);
    name.push("World!");

    name.close();
    push.close();
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
