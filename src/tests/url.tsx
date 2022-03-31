import { GlobalURL } from "./global-url";
import {
    createFragment,
    h,
    proxy,
    ProxyContext,
    ok,
    properties,
    children,
    descendants,
    descendantsSettled, isFulfilled, isDescendantFulfilled,
    name
} from "@virtualstate/focus";

type OtherKeys = "searchParams";
type ReadableKeys = "hash" | "host" | "hostname" | "href" | "password" | "pathname" | "port" | "protocol" | "search" | "username";
type UsableKeys = OtherKeys | ReadableKeys;

export interface URLOptions extends Partial<Pick<GlobalURL, UsableKeys>> {
    url?: string | GlobalURL;
    base?: string | GlobalURL;
}

export function URL({ url: urlInput, base, searchParams, ...rest }: URLOptions) {
    const url = new GlobalURL(urlInput, base);

    for (const [key, value] of Object.entries(rest)) {
        ok<ReadableKeys>(key);
        url[key] = value;
    }

    if (searchParams) {
        url.searchParams.forEach((value, key) => {
            url.searchParams.delete(key);
        });
        searchParams.forEach((value, key) => {
           url.searchParams.append(key, value);
        });
    }

    return <url initial={url.toString()} {...{ [ProxyContext]: { getters: { instance() { return url } }, proxy } } } />
}

const [url] = await children(<URL url="/example" base="https://example.com" search="?hmm=1" />)
ok<GlobalURL>(url);

console.log(url);

console.log({
    string: url.toString(),
    search: url.search,
    hmm: url.searchParams.get("hmm"),
    initial: properties(url).initial,
    isInitial: properties(url).initial === url.toString()
});

url.searchParams.set("hmm", "2");

console.log({
    string: url.toString(),
    search: url.search,
    hmm: url.searchParams.get("hmm"),
    initial: properties(url).initial,
    isInitial: properties(url).initial === url.toString()
});

const form = (
    <>
        <input name="name" value="value">
            <URL url="/input/name" base="https://example.com" search="?a=1" />
        </input>
    </>
)

const result = await descendantsSettled(form);
console.log(result);
console.log(result.filter(isDescendantFulfilled).find(({ value }) => name(value) === "url"));
