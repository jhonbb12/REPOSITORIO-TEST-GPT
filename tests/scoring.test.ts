import { describe, expect, it } from "vitest";
import { CRITERIA, weightedScore, isValidRatings } from "../src/domain/scoring";
import { filterProjects, normalizeSearch, validateCatalog, type Project } from "../src/domain/catalog";

describe("weighted scoring", () => {
  it("applies weights 30/30/25/15 and returns a 1–5 score", () => {
    expect(weightedScore({ relevancia: 5, inovacao: 4, execucao: 3, apresentacao: 2 })).toBeCloseTo(3.75);
    expect(CRITERIA.reduce((s,c)=>s+c.weight,0)).toBeCloseTo(1);
  });
  it("rejects incomplete or out-of-range ratings", () => {
    expect(isValidRatings({ relevancia: 5, inovacao: 4, execucao: 3, apresentacao: 6 })).toBe(false);
  });
});

describe("catalog validation and search", () => {
  const sample: Project = { id:"NAC-001", titulo:"Ação Ágil", modalidade:"NAC", area_tematica:"Educação", data:"2026-11-12", inicio:"09:00", fim:"10:00", formato:"Presencial", local:"Campus", fontes:[] };
  it("normalizes accents and case", () => expect(normalizeSearch("AÇÃO ÁGIL")).toBe("acao agil"));
  it("filters by accent-insensitive project title", () => expect(filterProjects([sample],"acao","NAC","","")).toHaveLength(1));
  it("reports incomplete official catalog instead of silently accepting it", () => {
    const result = validateCatalog([]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Esperados 46 projetos; recebidos 0.");
  });
});