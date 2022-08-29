import {descendants, h, isString} from "@virtualstate/focus";
import {toJSON} from "./app";
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
const host = `http://0.0.0.0:${server.addr.port}`

console.log(`HTTP webserver running. Access it at: ${host}`);

const onComplete = (async function watch() {
    for await (const connection of server) {
        await blockAndHandleConnection(connection);
    }

    async function blockAndHandleConnection(connection: DenoConnection) {
        const http = Deno.serveHttp(connection);
        const event = await http.nextRequest();
        event.respondWith(
            new Response(
                makeStream(),
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Content-Type-Options": "nosniff"
                    }
                }
            )
        );

        function makeStream() {
            return new ReadableStream({
                async start(controller) {
                    try {
                        const encoder = new TextEncoder();
                        for await (const string of toJSON()) {
                            controller.enqueue(
                                encoder.encode(string)
                            );
                        }
                    } catch (error) {
                        controller.error(error);
                    } finally {
                        controller.close();
                    }

                }
            })
        }
    }
})();


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

server.close();

await onComplete;
