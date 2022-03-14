declare module "dom-lite" {
  namespace Default {
    export const document: Document;

    export const HTMLElement: {
      prototype: HTMLElement;
      new (): HTMLElement;
    };
    export const Node: {
      prototype: Node;
      new (): Node;
    };
  }

  export type DOMNamespace = typeof Default;

  export default Default;
}
