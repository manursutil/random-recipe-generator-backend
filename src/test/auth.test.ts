import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { Hono } from "hono";

describe("signup endpoint", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "testsecret";
    mock.module("../db/queries", () => ({
      insertUser: async (_db: any, email: string, _password: string) =>
        "user-123",
    }));
  });

  afterEach(() => {
    mock.restore();
    delete process.env.JWT_SECRET;
  });

  it("Should signup a user", async () => {
    const { default: authRouter } = await import("../routes/authRouter");
    const app = new Hono().route("/auth", authRouter);

    const res = await app.request("/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@test.com",
        password: "password123",
      }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      message: string;
      user: { id: string; email: string };
    };
    expect(json.message).toBe("User registered successfully!");
    expect(json.user).toEqual({ id: "user-123", email: "test@test.com" });
    expect(res.headers.get("set-cookie")).toContain("authToken=");
  });

  it("returns 409 on duplicate email", async () => {
    mock.module("../db/queries", () => ({
      insertUser: async () => {
        throw new Error("UNIQUE constraint failed: users.email");
      },
    }));
    const { default: authRouter } = await import("../routes/authRouter");
    const app = new Hono().route("/auth", authRouter);

    const res = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dupe@test.com", password: "password123" }),
    });

    expect(res.status).toBe(409);
    const json = (await res.json()) as {
      errors: string;
    };
    expect(json.errors).toContain("Email already exists");
  });

  it("returns 400 on invalid payload", async () => {
    const { default: authRouter } = await import("../routes/authRouter");
    const app = new Hono().route("/auth", authRouter);

    const res = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad", password: "short" }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      errors: string;
    };
    expect(json.errors.length).toBeGreaterThan(0);
  });
});
