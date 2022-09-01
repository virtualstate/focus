import { h } from "@virtualstate/focus";
import {toResponse as toResponseBase} from "./response";

export async function *App() {
    console.log("Starting App");
    yield <p>Loading!</p>
    console.log("Doing thing 1");
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Finished thing 1");
    yield <p>Loaded</p>
}

export function toResponse() {
    return toResponseBase(<App />);
}