declare var Deno: unknown;
declare var Bun: unknown;

let timeout;

if (typeof Bun !== "undefined") {
  const timeoutMinutes = 2.5;
  const timeoutMs = Math.round(timeoutMinutes * 60000);
  const start = Date.now()
  timeout = setTimeout(() => {
    console.error(`Tests took longer than ${timeoutMinutes} minutes`, { start, now: Date.now(), timeoutMs })
    process.exit(1);
  }, timeoutMs);
}

await import("./access");
await import("./preact-jsx");
await import("./react-jsx");
await import("./typed");

if (typeof Bun === "undefined") {
  await import("./dom");
}
await import("./throw");

await import("../trying-to-write-documentation");
await import("./form");
await import("./date");
await import("./url");
await import("./to-map");
await import("./to-tree");
await import("./to-json");
await import("./to-kdl");
await import("./controller");
await import("./data");
await import("./match");

if (typeof Deno === "undefined" && typeof Bun === "undefined") {
  await import("./dom-to-json");
  await import("./dom-to-kdl");

  await import("./dom-template");
}
await import("./dom-fragment");

await import("./combine");

await import("./flat");
await import("./class");
await import("./raw-fragments");
await import("./design");
await import("./fragment-result");

await import("./push");
await import("./fragment-function");

try {
  await import("./server");
  await import("./navigation");
} catch (error) {
  console.error(error);
  if (typeof process !== "undefined" && process.exit) {
    process.exit(1)
  }
}


await import("./to-string");

if (typeof timeout !== "undefined") {
  clearTimeout(timeout);
}

export default 1;

if (typeof process !== "undefined" && process.exit) {
  process.exit(0)
}
