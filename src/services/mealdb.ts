import axios from "axios";

const baseUrl = "https://www.themealdb.com/api/json/v1/1/";

const http = axios.create({
  baseURL: baseUrl,
  timeout: 8000,
  headers: { Accept: "application/json" },
});

export const getRandomRecipe = async () => {
  const { data } = await http.get("random.php");
  return data;
};

export const getRecipeById = async (id: number) => {
  const { data } = await http.get(`lookup.php?i=${id}`);
  return data;
};

export const getRecipeByCategory = async (category: string) => {
  const { data } = await http.get(
    `filter.php?c=${encodeURIComponent(category)}`
  );
  return data;
};

export const getRecipeByArea = async (area: string) => {
  const { data } = await http.get(
    `filter.php?a=${encodeURIComponent(area)}`
  );
  return data;
};
