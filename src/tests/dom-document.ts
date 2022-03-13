import type { DOMNamespace } from "dom-lite";
import {ok} from "@virtualstate/focus";

let exportDefault: DOMNamespace;

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
   if (typeof window !== "undefined" && window.document) {
       exportDefault = {
           document: window.document,
           HTMLElement: window.HTMLElement,
           Node: window.Node
       };
   } else {
       try {
           const dom = await import("dom-lite");
           exportDefault = dom.default;
       } catch {

       }
   }
}

ok(exportDefault);

export default exportDefault;