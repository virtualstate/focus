import {route} from "@virtualstate/navigation/routes";
import {h} from "@virtualstate/focus";

route("/", () => (
    <main id="home">
        <a href="/blog">Blog</a>
    </main>
))