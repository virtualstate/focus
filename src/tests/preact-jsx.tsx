import { h } from "preact";
import { accessors } from "./access";

function Component(props: Record<string, unknown>) {
  return <div {...props}>{`component 1 ${JSON.stringify({ props })}`}</div>;
}

const multiTree = (
  <body data-attribute="value" value={1}>
    <main>
      <section id="main-section">
        <h1>hello world</h1>
        whats up
      </section>
      <footer id="foot">Footer content</footer>
      <Component id="component" />
    </main>
  </body>
);

console.group("Preact:\n");

// console.log(multiTree);

await accessors(multiTree, () => {});

console.groupEnd();
