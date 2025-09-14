import { describe, expect, it } from "bun:test";
import { insertUser } from "./queries";
import { dbConn } from "./db";

describe("insertUser", () => {
  it("should insert a user into the database", async () => {
    const db = dbConn();
    const email = "test@test.com";
    const password = "password123";
    const userId = insertUser(db, email, password);
    expect(userId).toBeDefined();
  });
});
