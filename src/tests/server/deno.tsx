import {descendants, h, isString, ok} from "@virtualstate/focus";
import {toResponse} from "./app";
import {memo} from "@virtualstate/memo";
import {Fetch} from "./fetch";

export default 1;

interface DenoConnection {

}

interface DenoServer extends AsyncIterable<DenoConnection>{
    addr: {
        port: number;
    }
    close(): void;
}

interface DenoHTTPEvent {
    request: Request;
    respondWith(response: Response): void;
}

interface DenoHttpConnection extends AsyncIterable<DenoHTTPEvent> {
    close(): void;
    nextRequest(): Promise<DenoHTTPEvent | undefined>;
}

declare var Deno: {
    listen(options: { port: number }): DenoServer
    serveHttp(connection: DenoConnection): DenoHttpConnection
}

const server = Deno.listen({ port: 0 });
const hostname = `http://0.0.0.0:${server.addr.port}`

console.log(`HTTP webserver running. Access it at: ${hostname}`);

const onComplete = (async function watch() {
    for await (const connection of server) {
        void handleConnection(connection);
    }

    async function handleConnection(connection: DenoConnection) {
        const http = Deno.serveHttp(connection);
        for await (const event of http) {
            event.respondWith(
                toResponse()
            )
        }
    }
})();

onComplete.catch(console.error);
//
{
    const response = await fetch(new URL("/test", hostname).toString(), {
        method: "GET"
    });
    console.log("Response received");

    ok(response.ok);

    const json = await response.json();

    console.log(await descendants(json));
}

{
    console.log("Next request");
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

console.log("done");

server.close();

await onComplete;
