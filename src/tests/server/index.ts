declare var Deno: unknown;
declare var Bun: unknown;

if (typeof Deno !== "undefined") {
    await import("./deno");
} else if (typeof Bun !== "undefined") {
    await import("./bun");
} else if (typeof process !== "undefined") {
    await import("./node");
}

export default 1;