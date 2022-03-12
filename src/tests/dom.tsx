import * as dom from "dom-lite";
import {proxy} from "../access";
import {descendants} from "../children";
import {ok} from "../like";

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

console.log(div);

div.id = "1";

console.log(div.getAttribute("id"));

ok(div.getAttribute("id") === "1");

console.log(await descendants(div));
ok((await descendants(div)).includes(value));


