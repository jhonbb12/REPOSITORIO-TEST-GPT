export type Modality = "Mostra Nacional" | "Mostra de Extensão";
export type ModalityCode = "NAC" | "EXT";
export interface SourceRef { arquivo: string; pagina: number }
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
  fontes: SourceRef[];
  conferencia?: string;
}
export interface CatalogFile {
  schema: "universo-if-catalogo-v1.0";
  evento: string;
  total: number;
  total_por_modalidade: Record<string, number>;
  extracao: Record<string, unknown>;
  projetos: Project[];
}
const required = ["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes"] as const;
const allowedFiles = new Set(["trabalhos-mostra-nacional.pdf","trabalhos-mostra-nacional-extensao.pdf"]);
function validTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
  return true;
}
function minutes(value: string): number {
  const [hours,mins]=value.split(":").map(Number);
  return hours*60+mins;
}
export function modalityCode(p: Project): ModalityCode {
  return p.modalidade === "Mostra Nacional" ? "NAC" : "EXT";
}
export function validateCatalog(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || !Array.isArray((value as CatalogFile).projetos)) {
    return { valid: false, errors: ["Estrutura inválida: esperado objeto com array projetos."] };
  }
  const catalog = value as CatalogFile;
  const projects = catalog.projetos;
  if (catalog.schema !== "universo-if-catalogo-v1.0") errors.push("Versão de schema inesperada.");
  if (catalog.total !== 46 || projects.length !== 46) errors.push(`Esperados 46 projetos; recebidos ${projects.length}.`);
  const national = projects.filter(p => p?.modalidade === "Mostra Nacional").length;
  const extension = projects.filter(p => p?.modalidade === "Mostra de Extensão").length;
  if (national !== 24) errors.push(`Mostra Nacional: esperado 24; recebido ${national}.`);
  if (extension !== 22) errors.push(`Mostra de Extensão: esperado 22; recebido ${extension}.`);
  if (catalog.total_por_modalidade?.["Mostra Nacional"] !== 24 || catalog.total_por_modalidade?.["Mostra de Extensão"] !== 22) errors.push("Metadados total_por_modalidade divergentes.");
  const ids = new Set<string>(), titles = new Set<string>();
  const countsByDay: Record<string,number> = {"2026-11-17":0,"2026-11-18":0};
  projects.forEach((p, index) => {
    if (!p || typeof p !== "object") { errors.push(`Registro ${index} inválido.`); return; }
    for (const key of required) if (!(key in p)) errors.push(`${p.id ?? index}: campo ausente ${key}.`);
    for (const key of ["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local"] as const) {
      if (typeof p[key] !== "string" || !p[key].trim()) errors.push(`${p.id ?? index}: campo textual inválido ${key}.`);
    }
    if (typeof p.id !== "string" || !/^(NAC|EXT)-\d{3}$/.test(p.id)) errors.push(`ID inválido no registro ${index}.`);
    else {
      if (ids.has(p.id)) errors.push(`ID duplicado: ${p.id}`);
      ids.add(p.id);
      const expected = p.id.startsWith("NAC-") ? "Mostra Nacional" : "Mostra de Extensão";
      if (p.modalidade !== expected) errors.push(`Modalidade incompatível com ${p.id}.`);
    }
    if (typeof p.titulo !== "string" || !p.titulo.trim()) errors.push(`${p.id}: título vazio.`);
    const titleKey = `${p.modalidade}:${String(p.titulo).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleUpperCase("pt-BR")}`;
    if (titles.has(titleKey)) errors.push(`Título duplicado na modalidade: ${p.titulo}`);
    titles.add(titleKey);
    if (!["Mostra Nacional","Mostra de Extensão"].includes(p.modalidade)) errors.push(`${p.id}: modalidade inválida.`);
    if (!(p.data in countsByDay)) errors.push(`${p.id}: data fora da programação.`);
    else countsByDay[p.data]++;
    if (!validTime(p.inicio) || !validTime(p.fim) || minutes(p.inicio)>=minutes(p.fim)) errors.push(`${p.id}: horário inválido.`);
    if (p.formato !== "Exposição de pôster" || p.local !== "Área de vivência") errors.push(`${p.id}: local/formato divergente da fonte.`);
    if (!Array.isArray(p.fontes) || !p.fontes.length || !p.fontes.every(f =>
      f && allowedFiles.has(f.arquivo) && Number.isInteger(f.pagina) && f.pagina >= 1 &&
      f.pagina <= (f.arquivo === "trabalhos-mostra-nacional-extensao.pdf" ? 5 : 3)
    )) errors.push(`${p.id}: proveniência inválida.`);
  });
  if (countsByDay["2026-11-17"]!==25 || countsByDay["2026-11-18"]!==21) errors.push("Distribuição por dia divergente (esperado 25/21).");
  for (let i=1;i<=24;i++) if (!ids.has(`NAC-${String(i).padStart(3,"0")}`)) errors.push(`ID ausente: NAC-${String(i).padStart(3,"0")}`);
  for (let i=1;i<=22;i++) if (!ids.has(`EXT-${String(i).padStart(3,"0")}`)) errors.push(`ID ausente: EXT-${String(i).padStart(3,"0")}`);
  return { valid: errors.length === 0, errors };
}
export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
}
export function filterProjects(projects: Project[], query: string, modality: string, area: string, day: string): Project[] {
  const q = normalizeSearch(query);
  return projects.filter(p =>
    (!q || normalizeSearch(`${p.id} ${p.titulo} ${p.area_tematica} ${p.local}`).includes(q)) &&
    (!modality || modalityCode(p) === modality) &&
    (!area || p.area_tematica === area) &&
    (!day || p.data === day)
  );
}