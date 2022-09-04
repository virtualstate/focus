import type {IncomingMessage} from "http";
import {toStream} from "../stream";
import {isArray} from "../../../../is";
import {dispatchEvent, FetchListenerFn} from "../fetch-listener";
import {createServer, Server, ServerResponse} from "http";
import {ok} from "@virtualstate/focus";

function fromIncomingMessage(message: IncomingMessage, baseUrl?: string) {
    const url = new URL(
        message.url,
        baseUrl
    );
    let body;
    if (message.method !== "GET" && message.method !== "HEAD") {
        body = toStream(message);
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(message.headers)) {
        if (typeof value === "string") {
            headers.set(key, value);
        } else if (isArray(value)) {
            for (const item of value) {
                headers.append(key, item);
            }
        }
    }
    return new Request(url, {
        method: message.method,
        headers,
        body
    });
}

function getHostname(server: Server) {
    const addressInfo = server.address();

    ok(typeof addressInfo !== "string");
    ok(addressInfo);

    const { port } = addressInfo;

    ok(port);

    return `http://0.0.0.0:${port}`;
}

export async function listen(fn: FetchListenerFn) {

    const server = createServer((message, response) => {
        void onMessage(message, response) // Allow throwing unhandled rejection
    })

    await new Promise<void>(resolve => server.listen(0, resolve));

    const url = getHostname(server);

    return {
        url,
        close
    } as const;

    function close() {
        return new Promise(resolve => server.close(resolve));
    }

    async function onMessage(message: IncomingMessage, serverResponse: ServerResponse) {
        let sentResponse = false;
        try {
            const { response, settle } = dispatchEvent(
                fromIncomingMessage(message, getHostname(server)),
                fn
            );
            await Promise.all([
                response.then(sendResponse),
                settle
            ]);
        } catch (error) {
            console.log(error);
            await sendResponse(
                new Response(undefined, {
                    status: 500
                })
            )
        }  finally {
            try {
                serverResponse.end()
            } catch {}
        }

        async function sendResponse(response: Response) {
            if (sentResponse) return;
            sentResponse = true;
            const { body, headers } = response;
            headers.forEach((value, key) => {
                serverResponse.setHeader(key, value);
            });
            serverResponse.writeHead(response.status, response.statusText);
            if (body) {
                return await body.pipeTo(new WritableStream({
                    write(chunk) {
                        serverResponse.write(chunk);
                    }
                }))
            }
        }
    }
}