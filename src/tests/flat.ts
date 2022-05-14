import {h, ok, toJSON} from "@virtualstate/focus";

const tree = {
    "main": [
        { "h1": "Title", "props": { "id": "title" }},
        { "p": "Paragraph 1", "attrs": { "id": "paragraph-1" }},
        { "p": "Paragraph 2", "attributes": { "id": "paragraph-2" }},
        { "p": [
                { "h1": "Paragraph 3" },
                "Content"
            ]},
        { "footer": "Footer" }
    ]
};

console.log(await toJSON(h(tree)));

console.log(await toJSON(h(tree), { flat: true }));

const samePropNameTree = {
    "main": [
        { "h1": "Title", "attrs": { "id": "title" }},
        { "p": "Paragraph 1", "attrs": { "id": "paragraph-1" }},
        { "p": "Paragraph 2", "attrs": { "id": "paragraph-2" }},
        { "p": [
                { "h1": "Paragraph 3" },
                "Content"
            ]},
        { "footer": "Footer" }
    ]
};

console.log(JSON.stringify(samePropNameTree));
console.log(await toJSON(h(samePropNameTree), { flat: true, space: "", props: "attrs" }));

ok(JSON.stringify(samePropNameTree) === await toJSON(h(samePropNameTree), { flat: true, space: "", props: "attrs" }))

export default 1;