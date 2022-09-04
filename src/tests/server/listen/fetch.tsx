import {toAsyncString} from "./body-string";
import {h, ok} from "@virtualstate/focus";
import {isArray} from "../../../is";

const DEFAULT_RETRIES = 3;

export interface FetchOptions extends RequestInit {
    url: URL | string
    retries?: number;
    isRetry?: boolean;
}

class FetchResponseError extends Error {

    response: Response;
    status: number;

    constructor(response: Response, message = "Failed to fetch") {
        super(message);
        this.response = response;
        this.status = response.status;
    }
}

export async function *Fetch(options: FetchOptions): AsyncIterable<unknown> {
    const { isRetry, retries, url } = options;
    if (isRetry) {
        console.log("Retrying fetch");
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
        if (typeof retries !== "number") {
            return yield <Fetch {...options} retries={DEFAULT_RETRIES} isRetry />;
        } else if (retries > 0) {
            return yield <Fetch {...options} retries={retries - 1} isRetry />;
        } else {
            throw new FetchResponseError(response);
        }
    }

    for await (const string of toAsyncString(response)) {
        yield * parsePart(string);
    }

    function parsePart(part: string) {
        if (part.startsWith(",")) {
            part = part.slice(1);
        }
        if (!part.startsWith("[")) {
            part = `[${part}`;
        }
        if (!part.endsWith("]")) {
            part = `${part}]`
        }
        const parsed = JSON.parse(part);
        ok(isArray(parsed));
        return parsed;
    }
}