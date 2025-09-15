import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { csrf } from "hono/csrf";
import { jwt } from "hono/jwt";

import recipeRouter from "./routes/recipeRouter";
import authRouter from "./routes/authRouter";
import savedRecipesRouter from "./routes/savedRecipesRouter";

const app = new Hono();

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:5173";
app.use(
  "/*",
  cors({
    origin: allowedOrigin,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-CSRF-Token"],
  })
);

app.use("/*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  if (process.env.NODE_ENV === "production") {
    c.header(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
});

app.use(logger());

const isPublicAuth = (path: string) =>
  path === "/auth/signup" || path === "/auth/login";

const isUnsafeMethod = (method: string) =>
  ["POST", "PUT", "PATCH", "DELETE"].includes(method);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

app.use("/auth/*", async (c, next) => {
  if (isPublicAuth(c.req.path)) return next();
  return jwt({ secret: process.env.JWT_SECRET!, cookie: "authToken" })(c, next);
});

app.use("/auth/*", csrf());

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

app.route("/recipes", recipeRouter);
app.route("/auth", authRouter);
app.route("/auth", savedRecipesRouter);

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
});

console.log(`Listening on http://localhost:${server.port} ...`);
