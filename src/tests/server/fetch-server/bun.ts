import {dispatchEvent, FetchEvent, FetchListenerFn} from "./fetch-listener";
import {toResponse} from "../app";

interface BunServer {
    stop(): void;
    port: number;
    hostname: string;
}

interface BunFetchOptions {
    fetch(request: Request): Promise<Response>
    port?: number;
}

declare var Bun: {
    exit?(code: number): void;
    serve(options: BunFetchOptions): BunServer
}

export async function listen(fn: FetchListenerFn) {
    const server = Bun.serve({
        async fetch(request): Promise<Response> {
            const { response, settle } = dispatchEvent(
                request,
                fn
            );
            await settle;
            return response;
        }
    });
    const { hostname } = server;
    return {
        url: hostname,
        close
    } as const;
    async function close() {
        await server.stop();
    }
}