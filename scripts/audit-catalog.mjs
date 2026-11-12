import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import assert from "node:assert/strict";
const file = new URL("../public/data/projects.json.gz", import.meta.url);
const catalog = JSON.parse(gunzipSync(fs.readFileSync(file)).toString("utf8"));
const projects = catalog.projetos;
assert.equal(catalog.schema,"universo-if-catalogo-v1.0");
assert.equal(projects.length,46);
assert.equal(projects.filter(p=>p.modalidade==="Mostra Nacional").length,24);
assert.equal(projects.filter(p=>p.modalidade==="Mostra de Extensão").length,22);
assert.equal(new Set(projects.map(p=>p.id)).size,46);
assert.equal(new Set(projects.map(p=>p.modalidade+":"+p.titulo.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toUpperCase())).size,46);
for (const p of projects) {
  for (const key of ["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes"]) {
    assert.ok(typeof p[key] === "string" || (key==="fontes" && Array.isArray(p[key])), `${p.id}: campo ${key}`);
  }
  assert.match(p.data,/^2026-11-(17|18)$/);
  assert.match(p.inicio,/^\\d{2}:\\d{2}$/);
  assert.match(p.fim,/^\\d{2}:\\d{2}$/);
  assert.equal(p.local,"Área de vivência");
  assert.equal(p.formato,"Exposição de pôster");
  assert.ok(p.fontes.length>0);
  for (const source of p.fontes) {
    assert.ok(Number.isInteger(source.pagina) && source.pagina>=1);
    assert.match(source.arquivo,/\\.pdf$/);
  }
}
assert.ok(projects.some(p=>p.id==="NAC-004" && p.titulo.startsWith("AGROSENTINELA:")));
assert.ok(projects.some(p=>p.id==="NAC-005" && p.titulo.startsWith("TRAÇO VIVO:")));
console.log("PASS — 46 projetos únicos (24 Mostra Nacional, 22 Mostra de Extensão).");
console.log("PASS — schema, datas, modalidade, local, formato e proveniência.");
