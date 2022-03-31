import { GlobalURL } from "./global-url";
import {h, proxy, ProxyContext, ok, properties, children} from "@virtualstate/focus";

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
    initial: properties(url).initial,
    isInitial: properties(url).initial === url.toString()
});

url.searchParams.set("hmm", "2");

console.log({
    string: url.toString(),
    search: url.search,
    initial: properties(url).initial,
    isInitial: properties(url).initial === url.toString()
});

