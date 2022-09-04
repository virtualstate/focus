

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

let timeout = 0;

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
                if (timeout) {
                    await new Promise(resolve => setTimeout(resolve, timeout));
                }
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

async function run(loops = 10) {
    let ok = 0,
        notOk = 0,
        exitCode = 0;
    for (let i = 0; i < loops; i += 1) {
        const response = await fetch(hostname);
        if (!response.ok) {
            console.error("Response not ok");
            console.error(response);
            notOk += 1;
            exitCode = 1;
        } else {
            console.log("Response ok");
            console.log(response);
            ok += 1;
            await response.json();
        }
    }
    return {
        ok,
        notOk,
        exitCode
    }
}

const timeouts = [
    0,
    // 100,
    // 500,
    // 1500,
    // 3000,
    // 10000
];

let allNotOk = 0,
    allOk = 0,
    exitCode = 0,
    maxTimeout = 0;

for (const currentTimeout of timeouts) {
    timeout = currentTimeout;
    maxTimeout = currentTimeout;

    const result = await run(500);

    console.log(result);
    allNotOk += result.notOk;
    allOk += result.ok;
    exitCode = exitCode || result.exitCode;

    if (!result.notOk) {
        // We didn't run into the problem on this platform with this timeout
        break;
    }
}

console.log({ allNotOk, allOk, maxTimeout });

await server.stop();

if (exitCode) {
    process.exit(exitCode);
}

