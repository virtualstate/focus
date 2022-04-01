import {h, toTree, createFragment, ok, properties} from "@virtualstate/focus";
import {URL} from "./url";
import {GlobalURL} from "./global-url";

const named = (
    <>
        <input name="name">
            <URL url="/example?h=name" />
        </input>
        <input name="email">
            <URL url="/example?h=email" />
        </input>
    </>
)

const map = await toTree(named);

for (const [parent, children] of map.entries()) {
    const url = children.find((url): url is GlobalURL => url instanceof GlobalURL);
    if (!properties(parent).name) continue;
    ok(url.searchParams.get("h") === properties(parent).name);
    console.log({ url });
}



