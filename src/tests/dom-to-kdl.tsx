import {h, document, appendDescendants} from "./dom-h";
import {ok, toJSON} from "@virtualstate/focus";
import { domExampleMain, domExampleTree } from "./dom-to-json";
import {toKDLString} from "@virtualstate/kdl";


// Reset our document
document.body.innerHTML = domExampleTree.innerHTML;

console.log(document.body.innerHTML);

const exampleKDL = await toKDLString(domExampleMain);
const mainKDL = await toKDLString(document.body.querySelector("main"));

console.log(exampleKDL);
console.log(mainKDL);

ok(exampleKDL.toLowerCase() === mainKDL.toLowerCase());
