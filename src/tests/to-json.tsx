import {
    h,
    toTree,
    createFragment,
    ok,
    properties,
    proxy, children,
} from "@virtualstate/focus";
import { URL } from "./url";
import { GlobalURL } from "./global-url";
import { toJSON, toJSONValue } from "../to-json";

const named = (
  <>
    <input name="name">
      <URL url="/example?h=name" />
    </input>
    <input name="email">
      <URL url="/example?h=email" />
    </input>
  </>
);

const json = await toJSON(named);
console.log(json);

for await (const json of toJSON(named)) {
  console.log(json);
}

const value = await toJSONValue(named);
console.log({ value });

for await (const value of toJSONValue(named)) {
  console.log({ value });
}

const proxied = proxy(named, { object: toJSONValue, json: toJSON });

console.log(await proxied.json);
console.log({ object: await proxied.object });

export async function Wait(
  { time, name }: { time: number; name?: string },
  input?: unknown
) {
  if (name) console.log(`Starting ${name}`);
  await new Promise((resolve) => setTimeout(resolve, time));
  if (name) console.log(`Finished ${name}`);
  return input;
}

for await (const json of toJSON(
  <>
    <Wait time={10}>
      <a />
    </Wait>
    <Wait time={20}>
      <b />
    </Wait>
  </>,
  {
    type: "name",
    props: "properties",
  }
)) {
  console.log(json);
}

for await (const json of toJSON(
  <>
    <Wait time={10} name="wait a">
      <a />
      <Wait time={5} name="wait c">
        <c />
      </Wait>
    </Wait>
    <Wait time={20} name="wait b">
      <b />
    </Wait>
    <d />
  </>
)) {
  console.log(json);
}

export async function* WaitGenerator(
  { time, name }: { time: number; name?: string },
  input?: unknown
) {
  if (name) console.log(`Configure ${name}`);
  yield <wait name={name} time={time} />;
  if (name) console.log(`Starting ${name}`);
  await new Promise((resolve) => setTimeout(resolve, time));
  if (name) console.log(`Finished ${name}`);
  yield input;
  if (name) console.log(`After ${name}`);
}

for await (const json of toJSON(
  <>
    <WaitGenerator time={10} name="wait a">
      <a />
      <WaitGenerator time={5} name="wait c">
        <c />
      </WaitGenerator>
    </WaitGenerator>
    <WaitGenerator time={20} name="wait b">
      <b />
    </WaitGenerator>
    <d />
  </>
)) {
  console.log(json);
}

for await (const value of toJSONValue(named)) {
    // the value is still a valid node, and can be read using the same functions
    console.log(await toJSON(value));
    console.log(await children(value));
    console.log(await equal(value, named));
}

async function equal(left: unknown, right: unknown) {
    // don't do rely on this lol, just for the example :)
    return await toJSON(left) === await toJSON(right);
}