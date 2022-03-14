import { name } from "@virtualstate/focus";
import { descendants, descendantsSettled } from "@virtualstate/focus";
import { ok } from "@virtualstate/focus";
import {
  h,
  appendChild,
  appendDescendants,
  HTMLElement,
  document,
} from "./dom-h";

const value = Math.random();

const div: HTMLElement = (
  <div className={["div", "dov"]}>
    <input
      style={{ fontWeight: "bold", color: "green" }}
      value={1}
      type="number"
    />
    <section
      id="section"
      class="a b"
      style="font-weight: normal; color: yellow;"
    >
      {value}
    </section>
  </div>
);

console.log({ div, instance: div instanceof HTMLElement });

const expectedId = `${Math.random()}`;

div.id = expectedId;
div.setAttribute("id", expectedId);

console.log({
  id: div.getAttribute("id"),
  [expectedId]: div.getAttribute(expectedId),
  className: div.className,
});

ok(
  div.getAttribute("id") === expectedId ||
    div.getAttribute(expectedId) === expectedId
);

console.log({ descendants: await descendants(div) });
ok((await descendants(div)).includes(value));

console.log({ descendantsSettled: await descendantsSettled(div) });
ok(
  (await descendantsSettled(div))
    .map((status) => (status.status === "fulfilled" ? status.value : undefined))
    .includes(value)
);

await appendDescendants(div);

await appendChild(div, document.body);
// These two are noop
await appendChild(div, document.body);
await appendChild(div, document.body);

console.log({ descendants: await descendants(div) });

const d = await descendants(div);
const input = d.find((node) => name(node) === "input");
const section = d.find((node) => name(node) === "section");

console.dir({
  section,
  ...(section instanceof HTMLElement
    ? {
        classList: section.classList,
        className: section.className,
        style: section.style,
        styleAttribute: section.getAttribute("style"),
      }
    : undefined),
});

console.dir({
  input,
  ...(input instanceof HTMLElement
    ? {
        classList: input.classList,
        className: input.className,
        style: input.style,
        styleAttribute: input.getAttribute("style"),
      }
    : undefined),
});
