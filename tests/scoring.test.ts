import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { CRITERIA, weightedScore, isValidRatings } from "../src/domain/scoring";
import { filterProjects, normalizeSearch, validateCatalog, type CatalogFile } from "../src/domain/catalog";

const catalog = JSON.parse(gunzipSync(readFileSync("public/data/projects.json.gz")).toString("utf8")) as CatalogFile;

describe("catálogo oficial", () => {
  it("valida 46 projetos, 24 nacionais e 22 de extensão", () => {
    expect(validateCatalog(catalog).valid).toBe(true);
    expect(catalog.projetos).toHaveLength(46);
    expect(catalog.projetos.filter(p=>p.modalidade==="Mostra Nacional")).toHaveLength(24);
    expect(catalog.projetos.filter(p=>p.modalidade==="Mostra de Extensão")).toHaveLength(22);
  });
  it("preserva IDs estáveis e registros AGROSENTINELA e TRAÇO VIVO separados", () => {
    expect(catalog.projetos.some(p=>p.id==="NAC-004" && p.titulo.startsWith("AGROSENTINELA:"))).toBe(true);
    expect(catalog.projetos.some(p=>p.id==="NAC-005" && p.titulo.startsWith("TRAÇO VIVO:"))).toBe(true);
  });
  it("normaliza acentos sem alterar os títulos originais", () => {
    expect(normalizeSearch("AÇAÍ")).toBe("acai");
    expect(catalog.projetos.find(p=>p.id==="NAC-003")?.titulo).toContain("AÇAÍ");
  });
  it("rejeita horário impossível e referência de página fora da fonte", () => {
    const invalidTime=structuredClone(catalog);
    invalidTime.projetos[0].inicio="29:75";
    expect(validateCatalog(invalidTime).valid).toBe(false);
    const invalidSource=structuredClone(catalog);
    invalidSource.projetos[0].fontes[0].pagina=99;
    expect(validateCatalog(invalidSource).valid).toBe(false);
  });
  it("rejeita distribuição por dia divergente", () => {
    const changed=structuredClone(catalog);
    changed.projetos[0].data="2026-11-18";
    expect(validateCatalog(changed).valid).toBe(false);
  });
  it("filtra modalidade e busca", () => {
    expect(filterProjects(catalog.projetos,"agrosentinela","NAC","","")).toHaveLength(1);
    expect(filterProjects(catalog.projetos,"","EXT","","")).toHaveLength(22);
  });
});

describe("avaliação ponderada", () => {
  it("usa pesos 30/30/25/15 e calcula [4,5,4,3] = 4,15", () => {
    expect(CRITERIA.reduce((s,c)=>s+c.weight,0)).toBeCloseTo(1);
    expect(weightedScore({inovacao:4,clareza:5,relevancia:4,demonstracao:3})).toBeCloseTo(4.15);
  });
  it("rejeita notas ausentes, decimais e fora de 1–5", () => {
    expect(isValidRatings({inovacao:4,clareza:5,relevancia:4,demonstracao:3.5})).toBe(false);
    expect(isValidRatings({inovacao:4,clareza:5,relevancia:4})).toBe(false);
    expect(isValidRatings({inovacao:0,clareza:5,relevancia:4,demonstracao:3})).toBe(false);
  });
});