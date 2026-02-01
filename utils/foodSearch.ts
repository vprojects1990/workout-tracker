import { db } from '@/db';
import { foodCache, foodSearchCache } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import Constants from 'expo-constants';

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const NUTRIENT_IDS = { calories: 1008, protein: 1003, carbs: 1005, fat: 1004 } as const;

export type FoodItem = {
  fdcId: number;
  description: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type EstimatedMacros = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function estimateMacros(food: FoodItem, weightGrams: number): EstimatedMacros {
  const factor = weightGrams / 100;
  return {
    name: food.description,
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
  };
}

// USDA FoodData Central API key is free (no cost, 1000 req/hr).
// It ships in the client bundle — acceptable risk for a free government API.
function getApiKey(): string {
  return Constants.expoConfig?.extra?.usdaApiKey ?? '';
}

function isCacheStale(cachedAt: number): boolean {
  return Date.now() - cachedAt > CACHE_MAX_AGE_MS;
}

type USDAFoodNutrient = { nutrientId: number; value: number };
type USDASearchFood = { fdcId: number; description: string; foodNutrients: USDAFoodNutrient[] };
type USDASearchResponse = { foods: USDASearchFood[] };

function parseUSDAFood(food: USDASearchFood): FoodItem {
  const getNutrient = (id: number) =>
    food.foodNutrients.find((n) => n.nutrientId === id)?.value ?? 0;
  return {
    fdcId: food.fdcId,
    description: food.description,
    caloriesPer100g: getNutrient(NUTRIENT_IDS.calories),
    proteinPer100g: getNutrient(NUTRIENT_IDS.protein),
    carbsPer100g: getNutrient(NUTRIENT_IDS.carbs),
    fatPer100g: getNutrient(NUTRIENT_IDS.fat),
  };
}

async function fetchFromUSDA(query: string): Promise<FoodItem[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('USDA API key not configured');

  const url = `${USDA_BASE_URL}?query=${encodeURIComponent(query)}&api_key=${apiKey}&pageSize=10&dataType=Foundation,SR%20Legacy`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`USDA API error: ${response.status}`);

  const data = await response.json();
  if (!data?.foods || !Array.isArray(data.foods)) return [];
  return (data as USDASearchResponse).foods.map(parseUSDAFood);
}

type CacheResult = { items: FoodItem[]; stale: boolean };

async function getCachedResultsInternal(query: string): Promise<CacheResult | null> {
  const normalizedQuery = query.toLowerCase().trim();
  const cached = await db.select().from(foodSearchCache).where(eq(foodSearchCache.query, normalizedQuery));
  if (cached.length === 0) return null;

  const entry = cached[0];
  let fdcIds: number[];
  try {
    fdcIds = JSON.parse(entry.fdcIds);
    if (!Array.isArray(fdcIds)) return null;
  } catch {
    return null;
  }
  if (fdcIds.length === 0) return { items: [], stale: isCacheStale(entry.cachedAt) };

  const foods = await db.select().from(foodCache).where(inArray(foodCache.fdcId, fdcIds));
  // Preserve order from fdcIds
  const foodMap = new Map(foods.map((f) => [f.fdcId, f]));
  const results: FoodItem[] = [];
  for (const id of fdcIds) {
    const f = foodMap.get(id);
    if (f) results.push(f);
  }

  return { items: results, stale: isCacheStale(entry.cachedAt) };
}

async function cacheResults(query: string, foods: FoodItem[]): Promise<void> {
  const normalizedQuery = query.toLowerCase().trim();
  const now = Date.now();

  // Upsert food items
  for (const food of foods) {
    await db
      .insert(foodCache)
      .values({
        fdcId: food.fdcId,
        description: food.description,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
        cachedAt: now,
      })
      .onConflictDoUpdate({
        target: foodCache.fdcId,
        set: {
          description: food.description,
          caloriesPer100g: food.caloriesPer100g,
          proteinPer100g: food.proteinPer100g,
          carbsPer100g: food.carbsPer100g,
          fatPer100g: food.fatPer100g,
          cachedAt: now,
        },
      });
  }

  // Upsert search query mapping
  const fdcIds = JSON.stringify(foods.map((f) => f.fdcId));
  await db
    .insert(foodSearchCache)
    .values({ query: normalizedQuery, fdcIds, cachedAt: now })
    .onConflictDoUpdate({
      target: foodSearchCache.query,
      set: { fdcIds, cachedAt: now },
    });
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  if (query.trim().length < 2) return [];

  const cached = await getCachedResultsInternal(query);

  if (cached && !cached.stale) {
    return cached.items;
  }

  try {
    const fresh = await fetchFromUSDA(query);
    await cacheResults(query, fresh);
    return fresh;
  } catch {
    // Network failure: return stale cache if available
    if (cached) return cached.items;
    throw new Error('No internet connection and no cached results');
  }
}
