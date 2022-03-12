import * as dom from "dom-lite";
import {proxy} from "@virtualstate/focus";
import {descendants, descendantsSettled} from "@virtualstate/focus";
import {ok} from "@virtualstate/focus";

const { document } = dom;

function createElement(tagName: string, options?: unknown, ...children: unknown[]) {
  let instance: HTMLElement;
  return proxy({
    tagName,
    options,
    get instance() {
      instance = instance ?? document.createElement(tagName, options);
      return instance;
    },
    children
  });
}

const h = createElement;

const value = Math.random();

const div: HTMLElement = <div><input value={1} type="number" /><section id="section">{value}</section></div>

console.log({ div });

div.id = "1";

console.log({ id: div.getAttribute("id") });

ok(div.getAttribute("id") === "1");

console.log({ descendants: await descendants(div) });
ok((await descendants(div)).includes(value));

console.log({ descendantsSettled: await descendantsSettled(div) });
ok((await descendantsSettled(div)).map(status => status.status === "fulfilled" ? status.value : undefined).includes(value));