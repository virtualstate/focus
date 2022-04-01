import {h, toMap, createFragment, ok, properties} from "@virtualstate/focus";
import {URL} from "./url";

const named = (
    <>
        <name />
        <next value={1} />
        <other value="string" />
    </>
)

const map = await toMap(named);

ok(typeof map.get("name") === "object")
ok(typeof map.get("next") === "object")
ok(typeof map.get("other") === "object")
ok(!Array.isArray(map.get("name")))
ok(!Array.isArray(map.get("next")))
ok(!Array.isArray(map.get("other")))

console.log({
    name: map.get("name"),
    next: map.get("next"),
    other: map.get("other")
});

const mapArray = await toMap(named, { array: true });

ok(Array.isArray(mapArray.get("name")))
ok(Array.isArray(mapArray.get("next")))
ok(Array.isArray(mapArray.get("other")))

console.log({
    name: mapArray.get("name"),
    next: mapArray.get("next"),
    other: mapArray.get("other")
});

// They are typed as an array as well
console.log({
    name: mapArray.get("name")[0],
    next: mapArray.get("next")[0],
    other: mapArray.get("other")[0]
})

const otherOptions = properties(map.get("other"));
ok<{ value: string }>(otherOptions, "", typeof otherOptions.value === "string");
console.log({ otherValue: otherOptions.value });

for await (const map of toMap(named)) {
    ok(!map.has("name") || typeof map.get("name") === "object")
    ok(!map.has("next") || typeof map.get("next") === "object")
    ok(!map.has("other") || typeof map.get("other") === "object")
    ok(!map.has("name") || !Array.isArray(map.get("name")))
    ok(!map.has("next") || !Array.isArray(map.get("next")))
    ok(!map.has("other") || !Array.isArray(map.get("other")))

    console.log({
        async: map.get("name"),
        next: map.get("next"),
        other: map.get("other")
    });
}

const namedTree = (
    <>
        <input name="name">
            <URL url="/example?h=name" />
        </input>
        <input name="email">
            <URL url="/example?h=email" />
        </input>
    </>
)

for await (const map of toMap(namedTree)) {
    // This will only include one url
    console.log([...map.entries()]);
}
for await (const map of toMap(namedTree, { array: true })) {
    // This will include multiple urls
    // See toTree to create an associative map
    console.log([...map.entries()]);
}