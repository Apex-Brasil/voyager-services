type ItemRecipe = {
  min: number;
  score: number;
};

export const holdersCoresRecipe: ItemRecipe[] = [
  { min: 1, score: 0.25 },
  { min: 501, score: 0.5 },
  { min: 1001, score: 0.75 },
  { min: 2001, score: 1 },
];

export const volumeScoreRecipe: ItemRecipe[] = [
  { min: 1, score: 0.25 },
  { min: 20001, score: 0.5 },
  { min: 50001, score: 0.75 },
  { min: 100001, score: 1 },
];

export const ageScoreRecipe: ItemRecipe[] = [
  { min: 2, score: 0.25 },
  { min: 7, score: 0.5 },
  { min: 13, score: 0.75 },
];

export const assessmentScoreByStars = 0.05;
