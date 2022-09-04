import { test } from "./test";
import {listen, toAsyncString, toResponse} from "./listen";
import { h } from "@virtualstate/focus";

export interface AppOptions {
    request: Request
}

export async function *App({ request }: AppOptions) {
    console.log("Starting App", request.url);
    yield <p>Loading {request.url.toString()}!</p>
    await new Promise(resolve => setTimeout(resolve, 500));
    yield <p>Loaded</p>

    if (request.method === "POST") {
        const body = JSON.parse(await toAsyncString(request));
        yield <echo-body {...body} />
    }

    console.log("Finished App", request.url);
}

const { url, close } = await listen(event => {
    event.respondWith(
        toResponse(
            <App
                request={event.request}
            />
        )
    )
});

await test(App, url);

console.log("Closing server");
await close();
console.log("Closed server");

export default 1;