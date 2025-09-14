import { describe, expect, it } from "bun:test";
import { insertUser } from "./queries";
import { dbConn } from "./db";

describe("insertUser", () => {
  it("should insert a user into the database", async () => {
    const db = dbConn();
    const email = "test@test.com";
    const password = "password123";
    const userId = await insertUser(db, email, password);
    console.log(userId);
    expect(userId).toBeDefined();
  });
});
