import { test } from "./test";
import {listen, toResponse} from "@virtualstate/listen";
import { h } from "@virtualstate/focus";

export interface AppOptions {
    request: Request
    text?: string
}

export async function *App({ request, text }: AppOptions) {
    console.log("Starting App", request.url);
    yield <p>Loading {request.url.toString()}!</p>
    await new Promise(resolve => setTimeout(resolve, 500));
    yield <p>Loaded</p>

    if (request.method === "POST") {
        const bodyText = text ?? await request.text();
        const body = JSON.parse(bodyText);
        yield <echo-body {...body} />
    }

    console.log("Finished App", request.url);
}

const { url, close } = await listen(async event => {
    let text;
    const { request } = event;
    const { method } = request;
    if (method !== "GET" && method !== "OPTIONS") {
        try {
            text = await request.text();
        } catch {}
    }
    event.respondWith(
        toResponse(
            <App
                request={event.request}
                text={text}
            />
        )
    )
});

await test(App, url);

console.log("Closing server");
await close();
console.log("Closed server");

export default 1;