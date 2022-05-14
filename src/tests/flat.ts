import {h, toJSON} from "@virtualstate/focus";

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

export default 1;