import {route} from "@virtualstate/navigation/routes";
import {h} from "@virtualstate/focus";

route("/blog", () => (
  <main id="blog" class="blog">
    <a href="/blog/1">Blog post 1</a>
    <a href="/blog/2">Blog post 2</a>
    <a href="/blog/3">Blog post 3</a>
    <a href="/">Home</a>
  </main>
))