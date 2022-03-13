declare module "dom-lite" {
  namespace Default {
    export const document: Document
    class HTMLElementImpl extends HTMLElement {}
    class NodeImpl extends Node {}

    export {
      HTMLElementImpl as HTMLElement,
      NodeImpl as Node
    }
  }

  export type DOMNamespace = typeof Default;

  export default Default;
}
