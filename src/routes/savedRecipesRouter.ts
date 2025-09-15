import { Hono } from "hono";
import { dbConn } from "../db/db";
import {
  deleteSavedRecipe,
  getSavedRecipes,
  insertSavedRecipe,
} from "../db/queries";

const savedRecipesRouter = new Hono();

savedRecipesRouter.post("/saved-recipes", async (c) => {
  const db = dbConn();
  const payload = c.get("jwtPayload");
  const { recipeId } = await c.req.json().catch(() => ({}));
  if (!Number.isFinite(recipeId))
    return c.json({ error: "Invalid recipeId" }, 400);
  insertSavedRecipe(db, payload.sub, Number(recipeId));
  return c.json({ ok: true });
});

savedRecipesRouter.get("/saved-recipes", async (c) => {
  const db = dbConn();
  const payload = c.get("jwtPayload");
  const ids = getSavedRecipes(db, payload.sub);
  return c.json({ recipes: ids });
});

savedRecipesRouter.delete("/saved-recipes/:id", async (c) => {
  const db = dbConn();
  const payload = c.get("jwtPayload");
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ error: "Invalid recipeId" }, 400);
  deleteSavedRecipe(db, payload.sub, id);
  return c.json({ ok: true });
});

export default savedRecipesRouter;
