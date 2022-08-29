import {h, descendants, isString, ok} from "@virtualstate/focus";
import {reader} from "./async-reader";
import {memo} from "@virtualstate/memo";
import {Fetch} from "./fetch";

export async function testJSXServer(hostname: string) {

    {
        const response = await fetch(new URL("/test", hostname).toString(), {
            method: "POST",
            body: JSON.stringify({
                value: 1
            })
        });
        console.log("Response received");

        ok(response.ok);

        const json = await response.json();

        console.log(await descendants(json));
    }

    {
        const response = await fetch(new URL("/test", hostname).toString(), {
            method: "POST",
            body: JSON.stringify({
                value: 1
            })
        });

        for await (const string of reader(response)) {
            console.log(string);
        }

    }

    {
        const url = new URL("/test", hostname);

        const root = memo(<Fetch url={url} method="GET" />);

        for await (const snapshot of descendants(root)) {
            console.log(snapshot);
        }

        // Will not hit service again as node is memo'd
        for await (const snapshot of descendants(root).filter(isString)) {
            console.log(snapshot);
        }

    }
}