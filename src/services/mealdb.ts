import axios from "axios";

const baseUrl = "https://www.themealdb.com/api/json/v1/1/";

export const getRandomRecipe = async () => {
  const response = await axios.get(`${baseUrl}random.php`);
  return response.data;
};

export const getRecipeById = async (id: number) => {
  const response = await axios.get(`${baseUrl}lookup.php?i=${id}`);
  return response.data;
};

export const getRecipeByCategory = async (category: string) => {
  const response = await axios.get(
    `${baseUrl}filter.php?c=${encodeURIComponent(category)}`
  );
  return response.data;
};

export const getRecipeByArea = async (area: string) => {
  const response = await axios.get(
    `${baseUrl}filter.php?a=${encodeURIComponent(area)}`
  );
  return response.data;
};
