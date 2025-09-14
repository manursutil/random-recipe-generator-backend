import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import recipeRouter from "./routes/recipeRouter";
import { dbConn } from "./db/db";

const app = new Hono();

app.use("/*", cors());
app.use(logger());

app.get("/", (c) => {
  dbConn();
  return c.json({ status: "ok" });
});

app.route("/recipes", recipeRouter);

const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
});

console.log(`Listening on http://localhost:${server.port} ...`);
