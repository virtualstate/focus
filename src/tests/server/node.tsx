import { createServer } from "http";
import { descendants, h, isString, ok} from "@virtualstate/focus";
import {reader} from "./async-reader";
import {Fetch} from "./fetch";
import {memo} from "@virtualstate/memo";
import {toJSON} from "./app";

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


    async function run() {
        console.log("Request started");
        response.writeHead(200, {
            "Content-Type": "application/json"
        });

        for await (const part of toJSON()) {
            response.write(part);
        }

        response.end();
        console.log("Request ended");
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
console.log(`HTTP webserver running. Access it at: ${host}`);

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