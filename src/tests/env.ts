const seenKeys = new Set<string | symbol>();

export const env: Record<string, string | undefined> = new Proxy({}, {
    get(target, p: string | symbol) {
        if (typeof p !== "string") return undefined;
        seenKeys.add(p);
        return getENV(p);
    },
    ownKeys() {
        return [...seenKeys];
    },
    has(target, p: string | symbol): boolean {
        return seenKeys.has(p);
    },
    getOwnPropertyDescriptor(target: {}, p: string | symbol): PropertyDescriptor | undefined {
        if (!seenKeys.has(p)) return undefined;
        return { enumerable: true, value: getENV(p), configurable: true }
    }
});

export function getENV(key: string | symbol) {
    if (!key) return undefined;
    return getNodeENV(key) || getDenoENV(key) || getWindowENV(key)
}

interface DenoEnv {
    env: {
        get(key: string): string | undefined;
    }
}

declare const Deno: DenoEnv

function getDenoENV(key: string | symbol) {
    if (typeof key !== "string") return undefined;
    if (typeof Deno === "undefined") return undefined;
    try {
        return Deno.env.get(key) ?? undefined;
    } catch {
        return undefined;
    }
}

function getWindowENV(key: string | symbol) {
    if (typeof window === "undefined") return undefined;
    const unknown: unknown = window;
    if (!isKey(unknown, key)) return undefined;
    const value = unknown.env[key];
    if (typeof value !== "string") return undefined;
    return value;

    function isKey<K extends string | symbol>(window: unknown, key: K): window is { env: Record<K, unknown> } {
        return typeof key === "string" && typeof window === "object" && isEnv(window) && typeof window.env === "object" && key in window.env;

        function isEnv(window: unknown): window is { env: object } {
            return typeof window === "object" && "env" in window;
        }
    }
}

function getNodeENV(key: string | symbol) {
    if (typeof key !== "string") return undefined;
    if (typeof process === "undefined") return undefined;
    return process.env[key];
}