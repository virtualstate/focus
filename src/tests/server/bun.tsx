import {toResponse} from "./app";
import {memo} from "@virtualstate/memo";
import {Fetch} from "./fetch";
import {descendants, h, isString, ok} from "@virtualstate/focus";
import {reader} from "./async-reader";

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
    serve(options: BunFetchOptions): BunServer
}

const server = Bun.serve({
    fetch(): Response {
        return toResponse()
    }
});

const { hostname } = server;

console.log(`HTTP webserver running. Access it at: ${hostname}`);

{
    const response = await fetch(new URL("/test", hostname).toString(), {
        method: "POST",
        body: JSON.stringify({
            value: 1
        })
    });
    console.log("Response received");

    ok(response.ok);

    console.log(response.body);

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

server.stop();