import { toResponse } from "./app";
import { testJSXServer } from "./test-server";
import { listen } from "./listen";

console.log("Starting server");

const { url, close } = await listen(event => {
    event.respondWith(toResponse(event.request))
});

await testJSXServer(url);

console.log("Closing server");
await close();
console.log("Closed server");

export default 1;