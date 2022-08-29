import {descendants, h, isString, ok} from "@virtualstate/focus";
import {toJSON, toResponse, toStream} from "./app";
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
        await blockAndHandleConnection(connection);
    }

    async function blockAndHandleConnection(connection: DenoConnection) {
        const http = Deno.serveHttp(connection);
        const event = await http.nextRequest();
        event.respondWith(
            toResponse()
        )
    }
})();

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

server.close();

await onComplete;
