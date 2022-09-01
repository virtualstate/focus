

interface BunServer {
    stop(): void;
    port: number;
    hostname: string;
}

interface BunFetchOptions {
    fetch(request: Request): Response
    port?: number;
}

declare var Bun: {
    exit?(code: number): void;
    serve(options: BunFetchOptions): BunServer
}

async function *generate() {
    yield "[";
    yield JSON.stringify({ a: "b" });
    for (let i = 0; i < 3; i += 1) {
        yield ",";
        yield JSON.stringify({ i });
    }
    yield "]"
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

export function toResponse(iterable: AsyncIterable<string>) {
    return new Response(
        toStream(iterable),
        {
            headers: {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff"
            }
        }
    )
}



const server = Bun.serve({
    fetch(): Response {
        return toResponse(generate())
    },
    port: 3010
});


const { hostname } = server;

console.log(`HTTP webserver running. Access it at: ${hostname}`);

const response = await fetch(hostname);

if (!response.ok) {
    console.error("Response not ok");
    console.error(response);
    process.exit(1);
} else {
    console.log("Response ok");
    console.log(response);
}

await server.stop();

