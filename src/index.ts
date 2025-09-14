import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import recipeRouter from "./routes/recipeRouter";
import { dbConn } from "./db/db";
import authRouter from "./routes/authRouter";

const app = new Hono();

app.use("/*", cors());
app.use(logger());

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

app.route("/recipes", recipeRouter);
app.route("/auth", authRouter);

const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
});

console.log(`Listening on http://localhost:${server.port} ...`);
