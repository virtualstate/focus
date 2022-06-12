import * as jsx from "@virtualstate/focus";
import { document } from "./dom-document";
import { h } from "@virtualstate/focus";

const Fragment: any = jsx.h("#document-fragment");
const Text: any = jsx.h("#text");

const node = (
  <Fragment>
    <inner />
    <Text>Test</Text>
  </Fragment>
);

console.log(jsx.isFragment(node));

const children = await jsx.children(node);
const inner = children.find((node) => jsx.name(node) === "inner");
const string = children.find((node) => jsx.isStaticChildNode(node));
console.log(inner);
console.log(string);

jsx.ok(jsx.isFragment(node));
jsx.ok(inner);
jsx.ok(string);
