import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { getUserByEmail, insertUser } from "./queries";
import { createTestDb } from "../test/test-db";
import { Database } from "bun:sqlite";

let db: Database;

beforeEach(() => {
  db = createTestDb();
});

afterEach(() => {
  db.close();
});

describe("insertUser", () => {
  it("should insert a user into the database", async () => {
    const email = "test@test.com";
    const password = "password123";
    const userId = await insertUser(db, email, password);
    expect(userId).toBeDefined();
  });

  it("should throw an error if email is already in db", async () => {
    const email = "test@test.com";
    const password = "password123";
    await insertUser(db, email, password);

    try {
      await insertUser(db, email, password);
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toMatch(/UNIQUE constraint failed/);
      }
    }
  });

  it("should throw error if password is empty", async () => {
    const email = "test@test.com";
    const password = "";

    try {
      await insertUser(db, email, password);
    } catch (error) {
      console.log(error as Error);
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toMatch(/password must not be empty/);
      }
    }
  });
});

describe("getUserByEmail", () => {
  it("should return user by a given email", async () => {
    const email = "test@test.com";
    const password = "password123";
    await insertUser(db, email, password);

    const user = getUserByEmail(db, email);
    console.log(user);
    expect(user).toBeDefined();
  });

  it("should return null when there is no user with that email", async () => {
    const email = "test@test.com";
    const user = getUserByEmail(db, email);
    console.log(user);
    expect(user).toBeNull();
  });
});
