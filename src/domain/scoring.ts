export const CRITERIA = [
  { id: "relevancia", label: "Relevância social", weight: 0.30 },
  { id: "inovacao", label: "Criatividade e inovação", weight: 0.30 },
  { id: "execucao", label: "Qualidade da execução", weight: 0.25 },
  { id: "apresentacao", label: "Clareza da apresentação", weight: 0.15 }
] as const;

export type CriterionId = typeof CRITERIA[number]["id"];
export type Ratings = Record<CriterionId, number>;

export const RATING_LABELS: Record<number, string> = {
  1: "Muito ruim", 2: "Ruim", 3: "Regular", 4: "Bom", 5: "Excelente"
};

export function isValidRatings(value: unknown): value is Ratings {
  if (!value || typeof value !== "object") return false;
  return CRITERIA.every(({ id }) => {
    const n = (value as Record<string, unknown>)[id];
    return Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 5;
  });
}

export function weightedScore(ratings: Ratings): number {
  if (!isValidRatings(ratings)) throw new Error("As quatro notas devem ser inteiros entre 1 e 5.");
  return CRITERIA.reduce((sum, criterion) => sum + ratings[criterion.id] * criterion.weight, 0);
}