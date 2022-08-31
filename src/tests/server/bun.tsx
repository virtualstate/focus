import {toResponse} from "./app";
import {testJSXServer} from "./test-server";

export default 1;

interface BunServer {
    stop(): void;
    port: number;
    hostname: string;
}

interface BunFetchOptions {
    fetch(request: Request): Response
    port?: number;
}

declare var Bun: {
    exit?(code: number): void;
    serve(options: BunFetchOptions): BunServer
}

const server = Bun.serve({
    fetch(): Response {
        return toResponse()
    }
});

const { hostname } = server;

console.log(`HTTP webserver running. Access it at: ${hostname}`);

await testJSXServer(hostname).catch(error => {
    console.error(error);
    process?.exit?.(1);
})

server.stop();