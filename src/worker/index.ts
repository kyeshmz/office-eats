import { Hono } from "hono";
import { api } from "./api";

const app = new Hono<{ Bindings: Env }>();
app.route("/api", api);
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
