import { estimateMacros, type FoodItem } from '../foodSearch';

const chickenBreast: FoodItem = {
  fdcId: 171077,
  description: 'Chicken, broilers or fryers, breast, skinless, boneless',
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
};

describe('estimateMacros', () => {
  it('calculates macros for 100g (identity)', () => {
    const result = estimateMacros(chickenBreast, 100);
    expect(result.name).toBe(chickenBreast.description);
    expect(result.calories).toBe(165);
    expect(result.protein).toBe(31);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(3.6);
  });

  it('scales macros for 200g', () => {
    const result = estimateMacros(chickenBreast, 200);
    expect(result.calories).toBe(330);
    expect(result.protein).toBe(62);
    expect(result.fat).toBe(7.2);
  });

  it('scales macros for 50g', () => {
    const result = estimateMacros(chickenBreast, 50);
    expect(result.calories).toBe(83); // 82.5 rounds to 83
    expect(result.protein).toBe(15.5);
  });

  it('returns zeros for 0g', () => {
    const result = estimateMacros(chickenBreast, 0);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });

  it('rounds protein/carbs/fat to 1 decimal place', () => {
    const food: FoodItem = {
      fdcId: 1,
      description: 'Test',
      caloriesPer100g: 100,
      proteinPer100g: 10.33,
      carbsPer100g: 20.67,
      fatPer100g: 5.55,
    };
    const result = estimateMacros(food, 150);
    expect(result.protein).toBe(15.5); // 10.33 * 1.5 = 15.495 → 15.5
    expect(result.carbs).toBe(31); // 20.67 * 1.5 = 31.005 → 31.0
    expect(result.fat).toBe(8.3); // 5.55 * 1.5 = 8.325 → 8.3
  });
});
