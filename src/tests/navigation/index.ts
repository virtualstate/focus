import { getRouter, Router } from "@virtualstate/navigation/routes";
import {children, descendants, name, properties} from "@virtualstate/focus";
import "./pages";
import {Navigation, NavigationTransition} from "@virtualstate/navigation";

// route(console.log);

interface State {
    seen: string[]
}

const navigation = new Navigation();
const router = new Router<State>(navigation);

const { routes, then } = router;

routes(getRouter());

const navigated = new Set();
const known: string[] = []

then(async (node, { destination }) => {

    const { pathname } = new URL(destination.url)
    navigated.add(pathname);
    navigated.add(destination.url);

    console.log(properties(node));

    const {
        a
    } = descendants(node).group(name);

    for (const { href } of await a.map(properties)) {
        if (typeof href !== "string") continue;
        if (known.includes(href)) continue;
        if (navigated.has(href)) continue;
        known.push(href);
    }

    const next = known.shift();
    if (next) {
        navigation.navigate(next);
    }
});

navigation.navigate("/");

await transition(navigation);

console.log("Navigated");

// Allow navigation to be used again without these routes
router.detach();

async function transition(navigation: Navigation) {
    let transition: NavigationTransition | undefined = undefined;
    while (navigation.transition && transition !== navigation.transition) {
        transition = navigation.transition;
        await transition.finished.catch(error => void error);
    }
}