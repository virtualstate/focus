declare module "https://deno.land/x/deno_dom/deno-dom-wasm.ts" {

    export class DOMParser {
        parseFromString(string: string, type: string): Document;
    }

    class ElementImpl extends Element {}
    class NodeImpl extends Node {}
    class HTMLElementImpl extends HTMLElement {}
    class DocumentImpl extends Document {}

    export {
        ElementImpl as Element,
        NodeImpl as Node,
        HTMLElementImpl as HTMLElement,
        DocumentImpl as Document
    }
}