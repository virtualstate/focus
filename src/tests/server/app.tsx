import { h } from "@virtualstate/focus";
import {toResponse as toResponseBase} from "./response";

export interface AppOptions {
    request: Request
}

export async function *App({ request }: AppOptions) {
    console.log("Starting App", request.url);
    if (request.method)
    yield <p>Loading {request.url.toString()}!</p>
    await new Promise(resolve => setTimeout(resolve, 500));
    yield <p>Loaded</p>
    console.log("Finished App", request.url);
}

export function toResponse(request: Request) {
    return toResponseBase(<App request={request} />);
}