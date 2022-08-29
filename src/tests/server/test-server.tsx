import {h, descendants, isString, ok, toJSON, children} from "@virtualstate/focus";
import {reader} from "./async-reader";
import {memo} from "@virtualstate/memo";
import {Fetch} from "./fetch";
import {isArray} from "../../is";
import {union} from "@virtualstate/union";
import {App} from "./app";

export async function testJSXServer(hostname: string) {

    const url = new URL("/test", hostname).toString();


    const response = await fetch(url);
    const json = await response.json()
    ok(isArray(json));

    {
        console.log(await descendants(json));
        ok(isArray(json));
    }

    {
        const response = await fetch(url);

        for await (const string of reader(response)) {
            console.log(string);
        }
    }

    {
        const root = memo(<Fetch url={url} />);

        for await (const snapshot of descendants(root)) {
            console.log(snapshot);
        }

        // Will not hit service again as node is memo'd
        for await (const snapshot of descendants(root).filter(isString)) {
            console.log(snapshot);
        }

    }

    {

        {
            let index = -1;
            for await (const part of toJSON(children(<Fetch url={url} />))) {
                index += 1;
                const string: string = JSON.stringify(json.at(index), undefined, "  ");
                console.log(part, string);
                ok(part === string);
            }
        }

        {
            const last = await toJSON(children(<Fetch url={url} />));
            const string: string = JSON.stringify(json.at(-1), undefined, "  ");
            console.log(last, string);
            ok(last === string);
        }

        {

            {
                const left = toJSON(<App />)[Symbol.asyncIterator]();
                const right = toJSON(children(<Fetch url={url} />))[Symbol.asyncIterator]();

                let leftResult,
                    rightResult;

                do {
                    ([
                        leftResult,
                        rightResult
                    ] = await Promise.all([
                        left.next(),
                        right.next()
                    ]));

                    if (leftResult.value && rightResult.value) {
                        ok(leftResult.value === rightResult.value)
                    } else {
                        ok(leftResult.done);
                        ok(rightResult.done);
                    }

                } while (!leftResult.done && !rightResult.done)
            }

            {
                for await (
                    const entries of union([
                    indexed(toJSON(<App />)),
                    indexed(toJSON(children(<Fetch url={url} />)))
                ])
                    ) {
                    if (entries.length < 2) continue;
                    if (!entries.every((entry) => entry && entries[0][0] === entry[0])) continue;

                    const values = entries.map(([,value]) => value);
                    console.log(...values);
                    ok(values.every(value => value === values[0]));

                }

                async function *indexed<T>(async: AsyncIterable<T>) {

                    let index = -1;
                    for await (const snapshot of async) {
                        index += 1;
                        yield [index, snapshot] as const;
                    }

                }
            }

        }
    }
}