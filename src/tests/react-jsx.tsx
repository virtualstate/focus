import * as ReactModule from "react";
import {accessors} from "./access";
import {ok} from "../like";
ok<{ createElement(...args: unknown[]): unknown }>(ReactModule);

function h(...args: unknown[]) {
    return ReactModule.createElement(...args);
}

function Component(props: Record<string, unknown>) {
    return <div {...props}>{`component 1 ${JSON.stringify({ props })}`}</div>
}

const multiTree = (
    <body data-attribute="value" value={1}>
        <main>
            <section id="main-section">
                <h1 key={1}>hello world</h1>
                whats up
            </section>
            <footer id="foot">Footer content</footer>
            <Component id="component" />
        </main>
    </body>
)

console.group("React:\n");

console.log(multiTree);

await accessors(multiTree);

console.groupEnd();