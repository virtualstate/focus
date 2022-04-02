import { h, createFragment, children } from "@virtualstate/focus";
import { toKDLString } from "@virtualstate/kdl";
import { Prompt } from "./prompt";
import { env } from "./env";

const name = <Prompt message="Name:" env="PROMPT_NAME" />;

console.log({ name: await children(name) });

const form = (
  <>
    {name}
    <Prompt message="Email:" env="PROMPT_EMAIL" />
  </>
);

console.log({ form: await children(form) });

const namedForm = (
  <form>
    <Prompt message="Name:" name="name" env="PROMPT_NAME" />
    <Prompt message="Email:" name="email" env="PROMPT_EMAIL" />
  </form>
);

console.log("run");

console.log(await toKDLString(namedForm));

console.log("run2");

console.log(await toKDLString(namedForm));

console.log("run3");

for await (const string of toKDLString(namedForm)) {
  console.log(string);
}

console.log({ ...env });
