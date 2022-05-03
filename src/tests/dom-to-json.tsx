import { h, document, appendDescendants } from "./dom-h";
import { ok, toJSON } from "@virtualstate/focus";

const footer = <footer>This is the footer</footer>;

export const domExampleMain: HTMLElement = (
  <main>
    <title>Hello</title>
    <section id="section-1">
      <p>Whats up</p>
      <p>This is a second line</p>
    </section>
    <section id={`section-${Math.random()}`}>
      <p>This is a second section</p>
    </section>
    {footer}
  </main>
);

export const domExampleTree: HTMLElement = <wrapper>{domExampleMain}</wrapper>;
await appendDescendants(domExampleTree);

console.log(footer);
console.log(domExampleTree);
console.log(domExampleTree.innerHTML);

// I want to ensure there is a complete copy over, I don't want to use the same element
// instances for this test
document.body.innerHTML = domExampleTree.innerHTML;

console.log(document.body.innerHTML);

const options = { toLowerCase: true };

const exampleJSON = await toJSON(domExampleMain, options);
const mainJSON = await toJSON(document.body.querySelector("main"), options);

console.log(exampleJSON);
console.log(mainJSON);

ok(exampleJSON === mainJSON);
