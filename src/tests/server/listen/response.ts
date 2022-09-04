import {toJSON} from "@virtualstate/focus";
import {toStream} from "./stream";

export async function *toJSONArray(parts: AsyncIterable<string>) {
    yield "[";
    let first = true;
    for await (const part of parts) {
        if (!first) yield ",";
        first = false;
        yield part;
    }
    yield "]";
}

export function toResponse(node: unknown) {
    return new Response(
        toStream(
            toJSONArray(
                toJSON(node)
            )
        ),
        {
            headers: {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff"
            }
        }
    )
}