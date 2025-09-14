import { type UUID, randomUUID } from "crypto";
import { Database } from "bun:sqlite";

export const insertUser = async (
  db: Database,
  email: string,
  password: string
) => {
  const userId = randomUUID();
  const passwordHash = await Bun.password.hash(password);

  const insertQuery = db.query(
    `
        INSERT INTO users (id, email, password_hash)
        VALUES (?, ?, ?)
        RETURN id
    `
  );

  const user = insertQuery.get(userId, email, passwordHash) as { id: UUID };
  return user.id;
};
