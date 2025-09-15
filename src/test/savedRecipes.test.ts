import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import savedRecipesRouter from "../routes/savedRecipesRouter";
import authRouter from "../routes/authRouter";
import { dbConn } from "../db/db";

describe("saved-recipes endpoints", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "testsecret";
    const db = dbConn();
    db.run("DELETE FROM saved_recipes;");
    db.run("DELETE FROM users;");
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  const buildApp = () => {
    const app = new Hono();

    app.use("/auth/*", async (c, next) => {
      const path = c.req.path;
      if (path === "/auth/signup" || path === "/auth/login") return next();
      return jwt({ secret: process.env.JWT_SECRET!, cookie: "authToken" })(
        c,
        next
      );
    });

    app.route("/auth", authRouter);
    app.route("/auth", savedRecipesRouter);
    return app;
  };

  const signupAndGetCookie = async (app: Hono) => {
    const res = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "password123" }),
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    const cookie = setCookie!.split(";")[0];
    return cookie;
  };

  it("saves and lists recipe IDs for the authenticated user", async () => {
    const app = buildApp();
    const cookie = await signupAndGetCookie(app);

    const saveRes = await app.request("/auth/saved-recipes", {
      method: "POST",
      headers: cookie
        ? { "Content-Type": "application/json", Cookie: cookie }
        : { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: 52772 }),
    });
    expect(saveRes.status).toBe(200);
    const saveJson = (await saveRes.json()) as { ok: boolean };
    expect(saveJson.ok).toBe(true);

    const listRes = await app.request("/auth/saved-recipes", {
      method: "GET",
      headers: cookie
        ? { "Content-Type": "application/json", Cookie: cookie }
        : { "Content-Type": "application/json" },
    });
    expect(listRes.status).toBe(200);
    const listJson = (await listRes.json()) as { recipes: number[] };
    expect(listJson.recipes).toEqual([52772]);
  });

  it("is idempotent when saving the same recipe twice", async () => {
    const app = buildApp();
    const cookie = await signupAndGetCookie(app);

    for (let i = 0; i < 2; i++) {
      const res = await app.request("/auth/saved-recipes", {
        method: "POST",
        headers: cookie
          ? { "Content-Type": "application/json", Cookie: cookie }
          : { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: 12345 }),
      });
      expect(res.status).toBe(200);
    }

    const listRes = await app.request("/auth/saved-recipes", {
      method: "GET",
      headers: cookie
        ? { "Content-Type": "application/json", Cookie: cookie }
        : { "Content-Type": "application/json" },
    });
    const listJson = (await listRes.json()) as { recipes: number[] };
    expect(listJson.recipes).toEqual([12345]);
  });

  it("removes a saved recipe on DELETE", async () => {
    const app = buildApp();
    const cookie = await signupAndGetCookie(app);

    await app.request("/auth/saved-recipes", {
      method: "POST",
      headers: cookie
        ? { "Content-Type": "application/json", Cookie: cookie }
        : { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: 99999 }),
    });

    const delRes = await app.request("/auth/saved-recipes/99999", {
      method: "DELETE",
      headers: cookie
        ? { "Content-Type": "application/json", Cookie: cookie }
        : { "Content-Type": "application/json" },
    });
    expect(delRes.status).toBe(200);
    const delJson = (await delRes.json()) as { ok: boolean };
    expect(delJson.ok).toBe(true);

    const listRes = await app.request("/auth/saved-recipes", {
      method: "GET",
      headers: cookie
        ? { "Content-Type": "application/json", Cookie: cookie }
        : { "Content-Type": "application/json" },
    });
    const listJson = (await listRes.json()) as { recipes: number[] };
    expect(listJson.recipes).toEqual([]);
  });

  it("returns 400 for invalid recipeId payload", async () => {
    const app = buildApp();
    const cookie = await signupAndGetCookie(app);

    const res = await app.request("/auth/saved-recipes", {
      method: "POST",
      headers: cookie
        ? { "Content-Type": "application/json", Cookie: cookie }
        : { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: "not-a-number" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const app = buildApp();
    const res = await app.request("/auth/saved-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: 10101 }),
    });
    expect(res.status).toBe(401);
  });
});
