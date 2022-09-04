import { h } from "@virtualstate/focus";
import {toResponse as toResponseBase} from "./response";
import { Request as RequestLike } from "@opennetwork/http-representation";

export type AnyRequest = Request | RequestLike;

export interface AppOptions {
    request: Partial<AnyRequest>
}

export async function *App({ request }: AppOptions) {
    console.log("Starting App", request.url);
    yield <p>Loading {request.url.toString()}!</p>
    await new Promise(resolve => setTimeout(resolve, 500));
    yield <p>Loaded</p>
    console.log("Finished App", request.url);
}

export function toResponse(request: AnyRequest) {
    return toResponseBase(<App request={request} />);
}