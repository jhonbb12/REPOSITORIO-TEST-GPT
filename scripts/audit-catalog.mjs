import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import assert from "node:assert/strict";

const file = new URL("../public/data/projects.json.gz", import.meta.url);
const catalog = JSON.parse(gunzipSync(fs.readFileSync(file)).toString("utf8"));
const projects = catalog.projetos;
const national = projects.filter(p=>p.modalidade==="Mostra Nacional");
const extension = projects.filter(p=>p.modalidade==="Mostra de Extensão");
const allowedFiles = new Set([
  "trabalhos-mostra-nacional.pdf",
  "trabalhos-mostra-nacional-extensao.pdf"
]);
const timeToMinutes = value => {
  assert.match(value,/^(?:[01]\d|2[0-3]):[0-5]\d$/,"horário deve estar em HH:MM válido");
  const [h,m]=value.split(":").map(Number);
  return h*60+m;
};

assert.equal(catalog.schema,"universo-if-catalogo-v1.0");
assert.equal(catalog.total,46);
assert.equal(projects.length,46);
assert.equal(national.length,24);
assert.equal(extension.length,22);
assert.deepEqual(catalog.total_por_modalidade,{"Mostra Nacional":24,"Mostra de Extensão":22});
assert.equal(new Set(projects.map(p=>p.id)).size,46);
assert.equal(new Set(projects.map(p=>p.modalidade+":"+p.titulo.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleUpperCase("pt-BR"))).size,46);

const countsByDay = {"2026-11-17":0,"2026-11-18":0};
for (const p of projects) {
  for (const key of ["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local"]) {
    assert.equal(typeof p[key],"string",p.id+": campo textual inválido: "+key);
    assert.ok(p[key].trim().length>0,p.id+": campo vazio: "+key);
  }
  assert.match(p.id,/^(NAC-\d{3}|EXT-\d{3})$/);
  assert.ok(["2026-11-17","2026-11-18"].includes(p.data),p.id+": data fora da programação");
  countsByDay[p.data]++;
  assert.ok(timeToMinutes(p.inicio)<timeToMinutes(p.fim),p.id+": horário final deve ser posterior ao inicial");
  assert.equal(p.local,"Área de vivência");
  assert.equal(p.formato,"Exposição de pôster");
  assert.ok(Array.isArray(p.fontes) && p.fontes.length>0,p.id+": fonte obrigatória");
  for (const source of p.fontes) {
    assert.ok(allowedFiles.has(source.arquivo),p.id+": arquivo-fonte não reconhecido");
    assert.ok(Number.isInteger(source.pagina) && source.pagina>=1,p.id+": página inválida");
    const maxPage=source.arquivo==="trabalhos-mostra-nacional-extensao.pdf"?5:3;
    assert.ok(source.pagina<=maxPage,p.id+": página fora do arquivo-fonte");
  }
}
assert.deepEqual(countsByDay,{"2026-11-17":25,"2026-11-18":21});
for (let i=1;i<=24;i++) assert.ok(projects.some(p=>p.id==="NAC-"+String(i).padStart(3,"0")),"ID nacional ausente: "+i);
for (let i=1;i<=22;i++) assert.ok(projects.some(p=>p.id==="EXT-"+String(i).padStart(3,"0")),"ID extensão ausente: "+i);
assert.ok(projects.some(p=>p.id==="NAC-004" && p.titulo.startsWith("AGROSENTINELA:")));
assert.ok(projects.some(p=>p.id==="NAC-005" && p.titulo.startsWith("TRAÇO VIVO:")));

console.log("PASS — 46 projetos únicos (24 Mostra Nacional, 22 Mostra de Extensão).");
console.log("PASS — IDs contínuos, títulos únicos e distribuição por dia 25/21.");
console.log("PASS — campos, horários, local, formato e páginas-fonte permitidas.");
