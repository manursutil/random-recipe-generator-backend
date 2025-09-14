import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { dbConn } from "../db/db";

describe("signup endpoint", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "testsecret";
    const db = dbConn();
    db.run("DELETE FROM users;");
  });

  afterEach(() => {
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
    expect(json.user.email).toBe("test@test.com");
    expect(typeof json.user.id).toBe("string");
    expect(res.headers.get("set-cookie")).toContain("authToken=");
  });

  it("returns 409 on duplicate email", async () => {
    const { default: authRouter } = await import("../routes/authRouter");
    const app = new Hono().route("/auth", authRouter);

    const first = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dupe@test.com", password: "password123" }),
    });
    expect(first.status).toBe(200);

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

describe("login endpoint", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "testsecret";
    const db = dbConn();
    db.run("DELETE FROM users;");
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it("logs in with valid credentials", async () => {
    const { default: authRouter } = await import("../routes/authRouter");
    const app = new Hono().route("/auth", authRouter);

    // Create the user via signup
    const signup = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "password123" }),
    });
    expect(signup.status).toBe(200);

    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "password123" }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      message: string;
      user: { id: string; email: string };
    };
    expect(json.message).toBe("Login successful");
    expect(json.user.email).toBe("test@test.com");
    expect(typeof json.user.id).toBe("string");
    expect(res.headers.get("set-cookie")).toContain("authToken=");
  });

  it("returns 401 for unknown email", async () => {
    const { default: authRouter } = await import("../routes/authRouter");
    const app = new Hono().route("/auth", authRouter);

    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nope@test.com", password: "whatever" }),
    });

    expect(res.status).toBe(401);
    const json = (await res.json()) as { errors: string[] };
    expect(json.errors).toContain("Invalid credentials");
  });

  it("returns 401 for wrong password", async () => {
    const { default: authRouter } = await import("../routes/authRouter");
    const app = new Hono().route("/auth", authRouter);

    // Create the user via signup with a known password
    const signup = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@test.com",
        password: "correct-password",
      }),
    });
    expect(signup.status).toBe(200);

    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@test.com",
        password: "wrong-password",
      }),
    });

    expect(res.status).toBe(401);
    const json = (await res.json()) as { errors: string[] };
    expect(json.errors).toContain("Invalid credentials");
  });

  it("returns 400 on invalid payload", async () => {
    const { default: authRouter } = await import("../routes/authRouter");
    const app = new Hono().route("/auth", authRouter);

    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad", password: "short" }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as { errors: string[] };
    expect(json.errors.length).toBeGreaterThan(0);
  });
});
