import { h, toJSON } from "@virtualstate/focus";

export async function *App() {
    console.log("Starting App");
    yield <p>Loading!</p>
    console.log("Doing thing 1");
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Finished thing 1");
    yield <p>Loaded</p>
    console.log("Finishing App");
}

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
                controller.close();
            } else {
                controller.enqueue(encoder.encode(value));
            }
        },
        async cancel() {
            await iterator.return();
        }
    }
}

export function toStream(node: unknown) {
    const source = toPullUnderlyingSource(
        toJSONArray(
            toJSON(node)
        )
    );
    return new ReadableStream(source);
}

export function toResponse(node: unknown = <App />) {
    return new Response(
        toStream(node),
        {
            headers: {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff"
            }
        }
    )
}