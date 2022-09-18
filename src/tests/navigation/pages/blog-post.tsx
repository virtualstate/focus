import {route} from "@virtualstate/navigation/routes";
import {h} from "@virtualstate/focus";

route("/blog/:id", (event, { pathname: { groups: { id }}}) => (
    <main id={`blog-post-${id}`} class="blog-post">
        <a href="/">Home</a>
    </main>
))