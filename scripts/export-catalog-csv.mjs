import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=path.join(root,"public/data/projects.json.gz");
const output=path.join(root,"exports/universo_if_catalogo_46_projetos_v1.0.csv");
const catalog=JSON.parse(gunzipSync(fs.readFileSync(source)).toString("utf8"));
if (catalog.schema!=="universo-if-catalogo-v1.0" || catalog.projetos?.length!==46) throw new Error("Catálogo não passou na validação mínima para exportação.");
const columns=["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes_paginas"];
const quote=value=>'"'+String(value??"").replace(/"/g,'""')+'"';
const lines=[columns.join(","),...catalog.projetos.map(p=>[
  p.id,p.titulo,p.modalidade,p.area_tematica,p.data,p.inicio,p.fim,p.formato,p.local,
  p.fontes.map(s=>s.arquivo+"#"+s.pagina).join(";")
].map(quote).join(","))];
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,"\uFEFF"+lines.join(String.fromCharCode(13,10))+String.fromCharCode(13,10),"utf8");
","utf8");
console.log("CSV gerado: "+path.relative(root,output)+" ("+catalog.projetos.length+" projetos).");
