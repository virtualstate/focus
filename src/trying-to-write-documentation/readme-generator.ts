import { promises as fs } from "fs";
import { extname } from "path";

const readme = await fs.readFile("README.md", "utf-8");
let lines = readme.split("\n");

const badgeMatch = /^\[\/\/]:\s+#\s+\(([^)]+)\)\s*$/

const badges = lines
    .filter(line => badgeMatch.test(line))

const replacedNames = new Set();

for (const badge of badges) {
    const [,name] = badge.match(badgeMatch);
    if (replacedNames.has(name)) continue;
    if (!/\.[tj]sx?$/.test(name)) continue;
    replacedNames.add(name);

    const contents = await fs.readFile(name, "utf-8").catch(() => "");
    if (!contents) continue;

    const extension = extname(name).replace(/^\./, "");
    const codeType = {
        tsx: "typescript jsx",
        ts: "typescript",
        jsx: "javascript jsx",
        js: "javascript"
    }[extension] || "typescript";

    const markdown = splitAndJoin(contents, codeType);

    const startIndex = lines.indexOf(badge) + 1;
    const remaining = lines.slice(startIndex);
    const endIndex = remaining.indexOf(badge);
    lines = [...lines.slice(0, startIndex), `\n${markdown}\n`, ...remaining.slice(endIndex)];

}

await fs.writeFile("README.md", lines.join("\n"), "utf-8");


function splitAndJoin(code: string, codeType: string) {
    const lines = code.split("\n");
    const indexed = Object.entries(lines);
    const commentStart = indexed
        .filter(([,line]) => /^\s*\/\*/.test(line) && !/^\s*\/\*{2}/.test(line))
        .map(([index]) => +index);

    const blocks = [];

    // Start at the first comment
    for (let index = commentStart[0]; index < lines.length; index += 1) {

        if (commentStart[0] === index) {
            commentStart.shift();
            const endIndex = lines.findIndex((line, lineIndex) => lineIndex > index &&  /\*\/\s*$/.test(line));
            if (endIndex === -1) {
                throw new Error("Expected to find end of comment");
            }
            const comment = lines.slice(index + 1, endIndex - 1).join("\n");
            blocks.push(comment.trim());
            index = endIndex;
        } else {
            const block = lines
                .slice(index, (commentStart[0] ?? lines.length + 1) - 1)
                .join("\n")
                .replace(/^\s*export default 1;?\s*$/m, "")
                .trim();

            if (!block) continue;
            blocks.push(`\`\`\`${codeType}\n${block}\n\`\`\``);
            index = commentStart[0] - 1;
        }

    }

    return blocks.join("\n\n");
}