import { createServer } from "http";
import { ok } from "@virtualstate/focus";
import { toResponse } from "./app";
import { testJSXServer } from "./test-server";
import {listen} from "./fetch-server";
//
// function getHostname() {
//     const addressInfo = server.address();
//
//     ok(typeof addressInfo !== "string");
//     ok(addressInfo);
//
//     const { port } = addressInfo;
//
//     ok(port);
//
//     return `http://0.0.0.0:${port}`;
// }
//
// console.log("Starting server");
// const server = createServer((request, response) => {
//     const { body, headers } = toResponse(
//         fromIncomingMessage(request, getHostname())
//     );
//     headers.forEach((value, key) => {
//         response.setHeader(key, value);
//     });
//     response.writeHead(response.statusCode, response.statusMessage);
//     void body.pipeTo(new WritableStream({
//         write(chunk) {
//             response.write(chunk);
//         },
//         close: end,
//         abort: end
//     }));
//     function end() {
//         try {
//             response.end()
//         } catch {}
//     }
// })
//
// await new Promise<void>(resolve => server.listen(0, resolve));
//
// const hostname = getHostname();
// console.log(`HTTP webserver running. Access it at: ${hostname}`);

const { url, close } = await listen(event => {
    event.respondWith(toResponse(event.request))
});

await testJSXServer(url);

await close();

// console.log("Closing server");
//
// await new Promise(resolve => server.close(resolve));
// console.log("Closed server");

export default 1;