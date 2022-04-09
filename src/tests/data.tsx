import {children, descendants, h, createFragment, ok} from "@virtualstate/focus";
import {toKDLString} from "@virtualstate/kdl";

export interface DataOptions {
    data?: Uint8Array | unknown[] | string;
}

export async function Data({ data }: DataOptions = {}, input?: unknown) {
    if (input) {
        const parts = await children(input);
        const numbers = parts.every(value => typeof value === "number");
        if (numbers) {
            return resolve(parts);
        }
        return parts.map(resolve);
    }
    if (data) {
        return resolve(data);
    }
    function resolve(data: Uint8Array | unknown[] | string | number): Uint8Array | Uint8Array[] {
        if (typeof data === "number") {
            // A single byte
            return new Uint8Array([data]);
        }
        if (data instanceof Uint8Array) {
            return data;
        }
        if (Array.isArray(data)) {
            if (isNumberArray(data)) {
                return new Uint8Array(data);
            }
            return data.flatMap(resolve);
        }
        ok(data, "Expected data to be an instance of Uint8Array, an Array, or a string", typeof data === "string");
        return new TextEncoder().encode(data);
    }

    function isNumberArray(array: unknown[]): array is number[] {
        return array.every(value => typeof value === "number");
    }
}




const input = [1, 2, 3, 4, 5];

// Was just curious what this would do
// Turns out Buffer/Uint8Array is an iterable (which makes sense because its literally got array in the name)
// So if a buffer is used as a child node, it will be flattened
console.log(await descendants(<Data data={input} />));

// This also means if we directly put two buffers together in a fragment, we can create a new buffer
console.log(await children(
    <Data>
        {input}
        {new Uint8Array([5, 1, 4])}
        {input}
    </Data>
));


// We can then let functions return strings or buffers/arrays directly

function KDLString(options?: unknown, input?: unknown) {
    return toKDLString(input);
}

async function *SomeData() {
    const encoder = new TextEncoder();
    yield encoder.encode(await toKDLString(<loading />));
    yield encoder.encode(await toKDLString(<loaded />));
}

function Head() {
    return (
        <head>
            <title>Hello</title>
        </head>
    )
}

function Body() {
    return (
        <body>
            <main>
                <h1>Hello World!</h1>
            </main>
        </body>
    )
}

const data = await children(
    <Data>
        <SomeData />
        {"\n"}
        {/* Data can contain other data */}
        <Data>
            <KDLString>
                <user id="1" />
                <organization id="1" />
            </KDLString>
        </Data>
        {"\n"}
        <KDLString>
            <html>
                <Body />
                <Head />
            </html>
        </KDLString>
    </Data>
)
console.log({ data });
ok(Array.isArray(data));
console.log(new TextDecoder().decode(new Uint8Array(data)));

interface WriteOptions {
    name: string;
}

async function Write({ name }: WriteOptions, input?: unknown) {
    const resolved = await children(
        <Data>
            {input}
        </Data>
    );
    ok(Array.isArray(resolved));
    const array = new Uint8Array(resolved);
    try {
        if (typeof Buffer !== "undefined") {
            const fs = await import("fs");
            await fs.promises.writeFile(name, array);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}
const name = `/tmp/virtualstate.focus.${Math.random()}`;

const [success] = await descendants(
    <Write name={name}>
        {data}
    </Write>
);

console.log({ name, success });

interface ReadOptions {
    name: string;
}

async function Read({ name }: ReadOptions) {
    try {
        if (typeof Buffer !== "undefined") {
            const fs = await import("fs");
            return fs.promises.readFile(name);
        }
        return "";
    } catch {
        return "";
    }
}

async function String(options?: unknown, input?: unknown) {
    const data = await children(
        <Data>
            {input}
        </Data>
    );
    ok(Array.isArray(data));
    const array = new Uint8Array(data);
    return new TextDecoder().decode(array);
}

const [string] = await children(
    <String>
        <Read name={name} />
    </String>
)

console.log({ name, string });