import {h, document, appendDescendants} from "./dom-h";
import {ok, toJSON} from "@virtualstate/focus";

export const domExampleMain: HTMLElement = (
    <main>
        <title>Hello</title>
        <section>
            <p>Whats up</p>
            <p>This is a second line</p>
        </section>
        <section>
            <p>This is a second section</p>
        </section>
        <footer>
            This is the footer
        </footer>
    </main>
);

export const domExampleTree: HTMLElement = (
    <wrapper>
        {domExampleMain}
    </wrapper>
);
await appendDescendants(domExampleTree);

console.log(domExampleTree);
console.log(domExampleTree.innerHTML)

// I want to ensure there is a complete copy over, I don't want to use the same element
// instances for this test
document.body.innerHTML = domExampleTree.innerHTML;


console.log(document.body.innerHTML);

const options = { toLowerCase: true }

const exampleJSON = await toJSON(domExampleMain, options);
const mainJSON = await toJSON(document.body.querySelector("main"), options);

console.log(exampleJSON);
console.log(mainJSON);

ok(exampleJSON === mainJSON);
