import { toKDLString as toKDL } from "@virtualstate/kdl";
import {
  h,
  createFragment,
  proxy,
} from "@virtualstate/focus";
import { URL } from "./url";
import { Wait, WaitGenerator } from "./to-json";

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

const kdl = await toKDL(named);
console.log({ kdl });

for await (const kdl of toKDL(named)) {
  console.log({ kdl });
}

const proxied = proxy(named, { kdl: toKDL });

console.log({ kdl: await proxied.kdl });

for await (const kdl of toKDL(
  <>
    <Wait time={10}>
      <a />
    </Wait>
    <Wait time={20}>
      <b />
    </Wait>
  </>
)) {
  console.log({ kdl });
}

for await (const kdl of toKDL(
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
  console.log({ kdl });
}

for await (const kdl of toKDL(
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
  console.log({ kdl });
}
