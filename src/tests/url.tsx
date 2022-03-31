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
import * as jsx from "@virtualstate/focus";
import {Prompt} from "./prompt";

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

let form = (
    <>
        <input name="name" value="value">
            <URL url="/input/name" base="https://example.com" search="?a=1" />
        </input>
    </>
)

let result = await descendantsSettled(form);
console.log(result);
console.log(result.filter(isDescendantFulfilled).find(({ value }) => name(value) === "url"));

interface InputOptions {
    name: string;
    placeholder?: string
    value?: string;
}

async function Input({ name, placeholder, ...rest }: InputOptions, input?: unknown) {
    const items = await children(input);
    const urlItem = items.find((item): item is GlobalURL => jsx.name(item) === "url");
    const url = urlItem ?? <URL url={`/inputs/${name}`} base="https://example.com" />;
    return (
        <input {...rest} name={name} placeholder={placeholder}>
            {url}
            <Prompt name={name} message={`${placeholder ?? name}:`} env={`PROMPT_${name.toUpperCase()}`} />
        </input>
    );
}

form = (
    <>
        <Input name="name" value="value">
            <URL url="/input/name" base="https://example.com" search="?a=1" />
        </Input>
        <Input name="email" value="email@example.com" />
    </>
)

result = await descendantsSettled(form);
console.log(result);
console.log(result.filter(isDescendantFulfilled).filter(({ value }) => name(value) === "url"));