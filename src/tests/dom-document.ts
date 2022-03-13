import * as dom from "dom-lite";
import { DOMNamespace } from "dom-lite";
import {ok} from "@virtualstate/focus";

let exportDefault: DOMNamespace = dom.default;

try {
    // @ts-ignore
    const { DOMParser, Node, HTMLElement, Element } = await import("https://deno.land/x/deno_dom/deno-dom-wasm.ts");

    const document = new DOMParser().parseFromString("<body />", "text/html");

    const nextDefault = {
        document, Node, HTMLElement: HTMLElement ?? Element, Element
    };

    ok<typeof exportDefault>(nextDefault);

    exportDefault = nextDefault;
} catch {

}

export default exportDefault;