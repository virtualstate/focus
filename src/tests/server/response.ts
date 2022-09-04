import {toJSON} from "@virtualstate/focus";

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

declare var Bun: unknown;

function toPullUnderlyingSource(iterable: AsyncIterable<string>): UnderlyingSource {
    const encoder = new TextEncoder();
    let iterator: AsyncIterator<string>;
    return {
        start() {
            iterator = iterable[Symbol.asyncIterator]();
        },
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) {
                if (typeof Bun === "undefined") {
                    controller.close();
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    controller.close();
                }
            } else {
                controller.enqueue(encoder.encode(value));
            }
        },
        async cancel() {
            await iterator.return();
        }
    }
}

export function toStream(iterable: AsyncIterable<string>) {
    const source = toPullUnderlyingSource(iterable);
    return new ReadableStream(source);
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