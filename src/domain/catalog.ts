export type Modality = "NAC" | "EXT";
export interface Project {
  id: string;
  titulo: string;
  modalidade: Modality;
  area_tematica: string;
  data: string;
  inicio: string;
  fim: string;
  formato: string;
  local: string;
  fontes: string[];
}

const requiredKeys: (keyof Project)[] = [
  "id", "titulo", "modalidade", "area_tematica", "data",
  "inicio", "fim", "formato", "local", "fontes"
];

export function validateProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return requiredKeys.every((key) => key in p) &&
    typeof p.id === "string" && typeof p.titulo === "string" &&
    (p.modalidade === "NAC" || p.modalidade === "EXT") &&
    typeof p.area_tematica === "string" && typeof p.data === "string" &&
    typeof p.inicio === "string" && typeof p.fim === "string" &&
    typeof p.formato === "string" && typeof p.local === "string" &&
    Array.isArray(p.fontes) && p.fontes.every((x) => typeof x === "string");
}

export function validateCatalog(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(value)) return { valid: false, errors: ["O catálogo precisa ser um array JSON."] };
  const ids = new Set<string>();
  value.forEach((item, index) => {
    if (!validateProject(item)) {
      errors.push(`Projeto na posição ${index} não atende ao schema obrigatório.`);
      return;
    }
    if (ids.has(item.id)) errors.push(`ID duplicado: ${item.id}`);
    ids.add(item.id);
    const expectedModality = item.id.startsWith("NAC-") ? "NAC" : item.id.startsWith("EXT-") ? "EXT" : null;
    if (!expectedModality || item.modalidade !== expectedModality) {
      errors.push(`Modalidade incompatível com o ID ${item.id}.`);
    }
  });
  const expected = new Set([
    ...Array.from({ length: 24 }, (_, i) => `NAC-${String(i + 1).padStart(3, "0")}`),
    ...Array.from({ length: 22 }, (_, i) => `EXT-${String(i + 1).padStart(3, "0")}`)
  ]);
  if (value.length !== 46) errors.push(`Esperados 46 projetos; recebidos ${value.length}.`);
  for (const id of expected) if (!ids.has(id)) errors.push(`ID obrigatório ausente: ${id}`);
  return { valid: errors.length === 0, errors };
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function filterProjects(projects: Project[], query: string, modality: string, area: string, day: string): Project[] {
  const q = normalizeSearch(query);
  return projects.filter((p) =>
    (!q || normalizeSearch(`${p.id} ${p.titulo} ${p.area_tematica} ${p.local}`).includes(q)) &&
    (!modality || p.modalidade === modality) &&
    (!area || p.area_tematica === area) &&
    (!day || p.data === day)
  );
}