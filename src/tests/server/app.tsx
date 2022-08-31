import { h, toJSON as toJSONPart } from "@virtualstate/focus";

export async function *App() {
    console.log("Starting App");
    yield <p>Loading!</p>
    console.log("Doing thing 1");
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Finished thing 1");
    yield <p>Loaded</p>
    console.log("Finishing App");
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
    const encoder = new TextEncoder();
    let iterator: AsyncIterator<string>;
    return {
        start() {
          iterator = toJSON()[Symbol.asyncIterator]();
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

export function toStream() {
    const source = toPullUnderlyingSource();
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