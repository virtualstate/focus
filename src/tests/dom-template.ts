import * as jsx from "@virtualstate/focus";
import { document } from "./dom-document";

const randomValue = ` Value ${Math.random()}`;

const templateString = `<main><h1>Example</h1><p><span>Test</span><span id='span-with-id'>${randomValue}</span></main>`;

// const template = document.createElement("template");
// template.innerHTML = templateString;
// ok(template.content);

const divTemplate = document.createElement("div");
divTemplate.innerHTML = templateString;
const template = { content: divTemplate };

const node = jsx.proxy(template.content, { descendants: jsx.descendants });

const descendants = await node.descendants;

console.log({ descendants });

jsx.ok(descendants.includes(randomValue));

const spanWithIdIndex = descendants
  .map(jsx.properties)
  .findIndex((props) => props.id === "span-with-id");
const spanWithId = descendants[spanWithIdIndex];

console.log({ spanWithId });

jsx.ok(spanWithId);
