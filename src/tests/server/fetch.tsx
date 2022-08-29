import {reader} from "./async-reader";
import {ok} from "@virtualstate/focus";
import {isArray} from "../../is";

export interface FetchOptions extends RequestInit {
    url: URL | string
}

export async function *Fetch(options: FetchOptions) {
    const response = await fetch(options.url.toString(), options);

    for await (const string of reader(response)) {
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