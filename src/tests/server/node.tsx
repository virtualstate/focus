import { createServer } from "http";
import { ok } from "@virtualstate/focus";
import { toStream } from "./app";
import { testJSXServer } from "./test-server";

console.log("Starting server");
const server = createServer((request, response) => {
    void toStream().pipeTo(new WritableStream({
        start() {
            response.writeHead(200, {
                "Content-Type": "application/json"
            });
        },
        write(chunk) {
            response.write(chunk);
        },
        close() {
            try {
                response.end()
            } catch {

            }
        },
        abort() {
            try {
                response.end()
            } catch {

            }
        }
    }));
})

await new Promise<void>(resolve => server.listen(0, resolve));
console.log("Started server");

const addressInfo = server.address();

ok(typeof addressInfo !== "string");
ok(addressInfo);

const { port } = addressInfo;

ok(port);

const hostname = `http://0.0.0.0:${port}`;
console.log(`HTTP webserver running. Access it at: ${hostname}`);

await testJSXServer(hostname);

console.log("Closing server");

await new Promise(resolve => server.close(resolve));
console.log("Closed server");

export default 1;