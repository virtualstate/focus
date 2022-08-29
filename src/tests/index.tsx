declare var Deno: unknown;
declare var Bun: unknown;

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

await import("./server");

export default 1;
