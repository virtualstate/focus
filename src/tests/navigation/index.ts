import {getRouter, Router} from "@virtualstate/navigation/routes";
import {children, descendants, name, properties} from "@virtualstate/focus";
import "./pages";
import {Navigation, transition} from "@virtualstate/navigation";

// route(console.log);

interface State {
    root?: boolean
    url?: string;
    from?: string;
    navigated: string[]
}

const navigation = new Navigation<State>({
    baseURL: "https://example.com"
});
const router = new Router<State>(navigation);

const { routes, then, route } = router;

const navigated = new Set<string>();
const known: string[] = []

route(console.log);
routes(getRouter());

then(async (node, { destination }) => {
    if (!node) return; // Empty routes

    navigated.add(destination.url);

    console.log(destination.url, properties(node));

    const {
        a
    } = descendants(node).group(name);

    for (const { href } of await a.map(properties)) {
        if (typeof href !== "string") continue;
        const url = new URL(href, destination.url).toString();
        if (known.includes(url)) continue;
        if (navigated.has(url)) continue;
        known.push(url);
    }

    const next = known.shift();
    if (next) {
        navigation.navigate(next, {
            state: {
                url: next,
                from: destination.url,
                navigated: [...navigated]
            }
        });
    }
});

navigation.navigate("/", {
    state: {
        root: true,
        navigated: []
    }
});

await transition(navigation);

console.log("Navigated");

for (const entry of navigation.entries()) {
    console.log(entry.getState());
}

// Allow navigation to be used again without these routes
router.detach();