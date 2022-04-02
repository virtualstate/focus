import {
  h,
  toTree,
  createFragment,
  ok,
  properties,
  proxy,
} from "@virtualstate/focus";
import { URL } from "./url";
import { GlobalURL } from "./global-url";

const named = (
  <>
    <input name="name">
      <URL url="/example?h=name" />
    </input>
    <input name="email">
      <URL url="/example?h=email" />
    </input>
  </>
);

const map = await toTree(named);

for (const [parent, children] of map.entries()) {
  const url = children.find(
    (url): url is GlobalURL => url instanceof GlobalURL
  );
  if (!properties(parent).name) continue;
  ok(url.searchParams.get("h") === properties(parent).name);
  console.log({ url });
}

for await (const map of toTree(named)) {
  for (const [parent, children] of map.entries()) {
    const url = children.find(
      (url): url is GlobalURL => url instanceof GlobalURL
    );
    if (!properties(parent).name) continue;
    ok(url.searchParams.get("h") === properties(parent).name);
    console.log({ url });
  }
}

for await (const map of toTree(named)) {
  console.log([...map.entries()]);
}

const proxied = proxy(named, { toTree });

for await (const map of proxied.toTree) {
  console.log({ tree: [...map.entries()] });
}

for await (const empty of toTree(<>{undefined}</>)) {
  console.log([...empty.entries()]);
}
