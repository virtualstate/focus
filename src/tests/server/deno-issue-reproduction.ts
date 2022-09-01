


interface DenoConnection {
    close?(): void;
}

interface DenoServer extends AsyncIterable<DenoConnection>{
    addr: {
        port: number;
    }
    close(): void;
}

interface DenoHTTPEvent {
    request: Request;
    respondWith(response: Response): Promise<void>;
}

interface DenoHttpConnection extends AsyncIterable<DenoHTTPEvent> {
    close(): void;
    nextRequest(): Promise<DenoHTTPEvent | undefined>;
}

declare var Deno: {
    listen(options: { port: number }): DenoServer
    serveHttp(connection: DenoConnection): DenoHttpConnection
}

const server = Deno.listen({ port: 0 });
const hostname = `http://0.0.0.0:${server.addr.port}`

console.log(`HTTP webserver running. Access it at: ${hostname}`);

const abortController = new AbortController();

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

const onComplete = (async function watch() {
    for await (const connection of server) {
        void handleConnection(connection).catch(error => void error);
    }

    async function handleConnection(connection: DenoConnection) {
        const http = Deno.serveHttp(connection);
        abortController.signal.addEventListener("abort", () => {
            try {
                http.close();
            } catch { }
        })
        for await (const event of http) {
            event.respondWith(
                toResponse(generate())
            )?.catch?.(error => void error)
        }
    }
})();

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

server.close();
abortController.abort();

await onComplete.catch(error => void error);

if (exitCode) {
    process.exit(exitCode);
}

