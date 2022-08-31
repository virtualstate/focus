import { h, toJSON as toJSONPart } from "@virtualstate/focus";

export async function *App() {
    yield <p>Loading!</p>
    await new Promise(resolve => setTimeout(resolve, 500));
    yield <p>Loaded</p>
}

export async function *toJSON() {
    yield "[";
    let first = true;
    for await (const part of toJSONPart(<App />)) {
        if (!first) yield ",";
        first = false;
        yield part;
    }
    yield "]";
}

function toPullUnderlyingSource(): UnderlyingSource {
    const iterator = toJSON()[Symbol.asyncIterator]();
    return {
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) {
                controller.close();
            } else {
                controller.enqueue(value);
            }
        }
    }
}

function toPushUnderlyingSource(): UnderlyingSource {
    return {
        async start(controller) {
            try {
                const encoder = new TextEncoder();
                for await (const string of toJSON()) {
                    controller.enqueue(
                        encoder.encode(string)
                    );
                }
            } catch (error) {
                controller.error(error);
            } finally {
                controller.close();
            }
        }
    }
}

declare var Deno: unknown;
function isPullSourceSupported() {
    return typeof Deno === "undefined";
}

export function toStream() {
    const source = isPullSourceSupported() ?
        toPullUnderlyingSource() :
        toPushUnderlyingSource();
    return new ReadableStream(source);
}

export function toResponse() {
    return new Response(
        toStream(),
        {
            headers: {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff"
            }
        }
    )
}