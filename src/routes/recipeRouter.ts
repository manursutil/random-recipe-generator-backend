import { Hono } from "hono";
import {
  getRandomRecipe,
  getRecipeById,
  getRecipeByCategory,
  getRecipeByArea,
} from "../services/mealdb";

const recipeRouter = new Hono();

recipeRouter.get("/random", async (c) => {
  try {
    const data = await getRandomRecipe();
    return c.json(data);
  } catch (err: any) {
    c.status(500);
    return c.json({ error: err?.message || "Failed to fetch random recipe" });
  }
});

recipeRouter.get("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id)) {
      c.status(400);
      return c.json({ error: "Invalid recipe id" });
    }
    const data = await getRecipeById(id);
    return c.json(data);
  } catch (err: any) {
    c.status(500);
    return c.json({ error: err?.message || "Failed to fetch recipe by id" });
  }
});

recipeRouter.get("/category/:category", async (c) => {
  try {
    const category = c.req.param("category");
    const data = await getRecipeByCategory(category);
    return c.json(data);
  } catch (err: any) {
    c.status(500);
    return c.json({
      error: err?.message || "Failed to fetch recipes by category",
    });
  }
});

recipeRouter.get("/area/:area", async (c) => {
  try {
    const area = c.req.param("area");
    const data = await getRecipeByArea(area);
    return c.json(data);
  } catch (err: any) {
    c.status(500);
    return c.json({ error: err?.message || "Failed to fetch recipes by area" });
  }
});
export default recipeRouter;
