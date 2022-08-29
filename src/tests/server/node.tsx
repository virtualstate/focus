import { createServer } from "http";
import {children, descendants, h, isString, ok, toJSON} from "@virtualstate/focus";
import {reader} from "./async-reader";
import {isArray} from "../../is";
import {Fetch} from "./fetch";
import {memo} from "@virtualstate/memo";

async function *App() {
    yield <p>Loading!</p>
    await new Promise(resolve => setTimeout(resolve, 500));
    yield <p>Loaded</p>
}

console.log("Starting server");
const server = createServer((request, response) => {

    run()
        .catch(error => {
           try {
               response.writeHead(500);
               response.write(String(error));
           }  catch {

           } finally {
               try {
                   response.end();
               } catch {
               }
           }

        });


    function header() {

        response.writeHead(200, {
            "Content-Type": "application/json"
        });
        response.write("[");
    }

    async function run() {
        console.log("Request started");
        header();

        let first = true;
        for await (const snapshot of toJSON(<App />)) {
            if (!first) response.write(",");
            first = false;
            response.write(snapshot);
        }

        footer();
        console.log("Request ended");
    }

    function footer() {
        response.write("]");
        response.end();
    }



})

await new Promise<void>(resolve => server.listen(0, resolve));
console.log("Started server");

const addressInfo = server.address();

ok(typeof addressInfo !== "string");
ok(addressInfo);

const { port } = addressInfo;

ok(port);

const host = `http://0.0.0.0:${port}`;

{
    const response = await fetch(new URL("/test", host).toString(), {
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
    const response = await fetch(new URL("/test", host).toString(), {
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
    const url = new URL("/test", host);

    const root = memo(<Fetch url={url} method="GET" />);

    for await (const snapshot of descendants(root)) {
        console.log(snapshot);
    }

    // Will not hit service again as node is memo'd
    for await (const snapshot of descendants(root).filter(isString)) {
        console.log(snapshot);
    }

}

console.log("Closing server");

await new Promise(resolve => server.close(resolve));
console.log("Closed server");

export default 1;