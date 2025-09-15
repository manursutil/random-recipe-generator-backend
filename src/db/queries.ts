import { type UUID, randomUUID } from "crypto";
import { Database } from "bun:sqlite";

// Auth queries

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
    RETURNING id
    `
  );

  const user = insertQuery.get(userId, email, passwordHash) as { id: UUID };
  return user.id;
};

export const getUserByEmail = (db: Database, email: string) => {
  const userQuery = db.query(
    `
    SELECT id, password_hash FROM users WHERE email = ?
    `
  );
  const user =
    (userQuery.get(email) as {
      id: string;
      password_hash: string;
    }) || null;
  return user;
};

export const getUserById = (db: Database, id: string) => {
  const userQuery = db.query(
    `
    SELECT id, email FROM users WHERE id = ?
    `
  );
  const user =
    (userQuery.get(id) as {
      id: string;
      email: string;
    }) || null;
  return user;
};

// Recipe queries

export const insertSavedRecipe = (
  db: Database,
  userId: string,
  recipeId: number
) => {
  const q = db.query(`
    INSERT OR IGNORE INTO saved_recipes (user_id, recipe_id)
    VALUES (?, ?)
    `);
  q.run(userId, recipeId);
};

export const getSavedRecipes = (db: Database, userId: string) => {
  const q = db.query(
    `SELECT recipe_id FROM saved_recipes WHERE user_id = ? ORDER BY created_at DESC`
  );
  return (q.all(userId) as { recipe_id: number }[]).map((r) => r.recipe_id);
};

export const deleteSavedRecipe = (
  db: Database,
  userId: string,
  recipeId: number
) => {
  const q = db.query(
    `DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?`
  );
  q.run(userId, recipeId);
};
