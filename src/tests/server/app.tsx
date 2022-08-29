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
