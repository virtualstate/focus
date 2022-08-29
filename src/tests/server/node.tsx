import { createServer } from "http";
import { descendants, h, isString, ok} from "@virtualstate/focus";
import {reader} from "./async-reader";
import {Fetch} from "./fetch";
import {memo} from "@virtualstate/memo";
import {toJSON} from "./app";
import {testJSXServer} from "./test-server";

console.log("Starting server");
const server = createServer((request, response) => {

    run()
        .catch(error => {
           try {
               response.writeHead(500);
               response.write(String(error));
           }  catch {

           } finally {
               try {
                   response.end();
               } catch {
               }
           }

        });


    async function run() {
        console.log("Request started");
        response.writeHead(200, {
            "Content-Type": "application/json"
        });

        for await (const part of toJSON()) {
            response.write(part);
        }

        response.end();
        console.log("Request ended");
    }



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