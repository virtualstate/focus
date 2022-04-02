import {h, toTree, createFragment, ok, properties, proxy} from "@virtualstate/focus";
import {URL} from "./url";
import {GlobalURL} from "./global-url";
import {toJSON, toJSONValue} from "../to-json";

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

const json = await toJSON(named);
console.log({ json });

for await (const json of toJSON(named)) {
    console.log({ json });
}

const value = await toJSONValue(named);
console.log({ value });

for await (const value of toJSONValue(named)) {
    console.log({ value });
}

const proxied = proxy(named, { object: toJSONValue, json: toJSON });

console.log({ json: await proxied.json });
console.log({ object: await proxied.object });

for await (const json of toJSON(
    <>
        <Wait time={10}><a /></Wait>
        <Wait time={20}><b /></Wait>
    </>,
    {
        type: "name",
        props: "properties"
    }
)) {
    console.log({ json });
}


async function Wait({ time }: { time: number }, input?: unknown) {
    await new Promise(resolve => setTimeout(resolve, time));
    return input;
}
for await (const json of toJSON(
    <>
        <Wait time={10}><a /><Wait time={5}><c /></Wait></Wait>
        <Wait time={20}><b /></Wait>
        <d />
    </>
)) {
    console.log({ json });
}