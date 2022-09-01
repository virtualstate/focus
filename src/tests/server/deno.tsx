import {toResponse} from "./app";
import {testJSXServer} from "./test-server";

export default 1;

interface DenoConnection {
    close?(): void;
}

interface DenoServer extends AsyncIterable<DenoConnection>{
    addr: {
        port: number;
    }
    close(): void;
}

interface DenoHTTPEvent {
    request: Request;
    respondWith(response: Response): Promise<void>;
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

const abortController = new AbortController();

const onComplete = (async function watch() {
    for await (const connection of server) {
        void handleConnection(connection).catch(error => void error);
    }

    async function handleConnection(connection: DenoConnection) {
        const http = Deno.serveHttp(connection);
        abortController.signal.addEventListener("abort", () => {
            try {
                http.close();
            } catch { }
        })
        for await (const event of http) {
            event.respondWith(
                toResponse()
            ).catch(error => void error)
        }
    }
})();

onComplete.catch(console.error);

await testJSXServer(hostname);

server.close();
abortController.abort();

await onComplete;
