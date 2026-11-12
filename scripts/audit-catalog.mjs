import fs from "node:fs";
const path = new URL("../src/data/projects.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const expected = [
  ...Array.from({length:24},(_,i)=>`NAC-${String(i+1).padStart(3,"0")}`),
  ...Array.from({length:22},(_,i)=>`EXT-${String(i+1).padStart(3,"0")}`)
];
const ids = new Set();
const errors = [];
if (!Array.isArray(data)) errors.push("Raiz do JSON não é um array.");
else {
  if (data.length !== 46) errors.push(`Quantidade incorreta: ${data.length}/46.`);
  for (const [i,p] of data.entries()) {
    for (const key of ["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes"]) {
      if (!(key in (p ?? {}))) errors.push(`Índice ${i}: campo ausente ${key}.`);
    }
    if (p?.id && ids.has(p.id)) errors.push(`ID duplicado: ${p.id}`);
    if (p?.id) ids.add(p.id);
  }
  for (const id of expected) if (!ids.has(id)) errors.push(`ID obrigatório ausente: ${id}`);
}
if (errors.length) {
  console.error("CATÁLOGO NÃO HOMOLOGADO");
  errors.forEach(e=>console.error(" - "+e));
  process.exitCode = 1;
} else console.log("PASS: 46 IDs e estrutura mínima presentes. Conferência documental dos PDFs ainda é um gate separado.");
