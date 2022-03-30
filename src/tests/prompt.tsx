import {h} from "@virtualstate/focus";
import {env} from "./env";

export interface PromptOptions {
    name?: string;
    message?: string;
    env?: string;
    prompt?: typeof prompt;
    enabled?: boolean;
}

const globalPrompt = typeof prompt === "undefined" ? undefined : prompt;

async function nodePromptImpl(message: string) {
    const module = await import("node:readline");
    const readline = module.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    try {
        return await new Promise(resolve => readline.question(`${message} `, resolve));
    } finally {
        readline.close();
    }
}
const nodePrompt = typeof process === "undefined" ? undefined : nodePromptImpl;



let promptQueue: Promise<unknown> = Promise.resolve()

export async function *Prompt(options?: PromptOptions, input?: unknown): AsyncIterable<unknown> {
    const envValue = options.env ? env[options.env] : undefined;
    if (envValue) {
        return yield <prompt {...options}>{envValue}</prompt>
    }
    yield <prompt {...options} />;
    const promise = promptQueue.then(() => prompt())
    let resolve: () => void;
    promptQueue = promise.then(async () => {
        return new Promise<void>(fn => resolve = fn);
    })
    yield <prompt {...options}>{await promise}</prompt>
    await promise;
    resolve();

    async function prompt() {
        const localPrompt = options.prompt ?? globalPrompt;
        if (typeof localPrompt === "function" && options.enabled !== false) {
            return localPrompt(options.message);
        }
        if (nodePrompt) {
            try {
                return await nodePrompt(options.message);
            } catch {}
        }
        return input;
    }
}