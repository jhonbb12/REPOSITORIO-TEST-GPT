/**
 * Universo IF Avalia — Apps Script + Google Sheets.
 * A planilha deve permanecer privada. A votação inicia FECHADA.
 */
const SHEETS = {
  projetos: ["Projetos", ["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes_paginas"]],
  codigos: ["Codigos", ["hash_codigo","ativo","criado_em"]],
  avaliacoes: ["Avaliacoes", ["id_requisicao_hash","hash_codigo","id_projeto","c1_inovacao","c2_clareza","c3_relevancia","c4_demonstracao","nota_ponderada","recibo","criado_em","estado"]],
  config: ["Configuracao", ["chave","valor"]]
};
const WEIGHTS = [0.30,0.30,0.25,0.15];
const CRITERIA_COUNT = 4;

function setupSheets() {
  const ss = openSpreadsheet_();
  Object.values(SHEETS).forEach(def => ensureSheet_(ss,def));
  const config = ensureSheet_(ss,SHEETS.config);
  const existing = config.getDataRange().getValues().slice(1).map(r=>String(r[0]));
  [["voting_status","CLOSED"],["ranking_minimum","5"],["catalog_version","1.0"]].forEach(row=>{
    if (!existing.includes(row[0])) config.appendRow(row);
  });
  return "Abas e configurações iniciais verificadas. A votação permanece FECHADA.";
}

/** Registra somente SHA-256 do token. Execute manualmente no editor, nunca como endpoint. */
function registerCode(token) {
  const value=String(token||"").trim();
  if (value.length<24) throw new Error("Use token aleatório de alta entropia (mínimo recomendado: 24 caracteres).");
  const ss=openSpreadsheet_(), sheet=ensureSheet_(ss,SHEETS.codigos), hash=sha256_(value);
  const rows=sheet.getDataRange().getValues();
  if (rows.some((r,i)=>i>0 && r[0]===hash)) throw new Error("Código já cadastrado.");
  sheet.appendRow([hash,true,new Date()]);
  return "Código cadastrado: somente o hash foi armazenado.";
}

function setVotingStatus(status) {
  const normalized=String(status||"").toUpperCase();
  if (!["OPEN","CLOSED"].includes(normalized)) throw new Error("Use OPEN ou CLOSED.");
  const ss=openSpreadsheet_(), sheet=ensureSheet_(ss,SHEETS.config);
  const rows=sheet.getDataRange().getValues();
  const index=rows.findIndex((r,i)=>i>0 && r[0]==="voting_status");
  if (index<0) sheet.appendRow(["voting_status",normalized]);
  else sheet.getRange(index+1,2).setValue(normalized);
  return "Status atualizado para "+normalized+".";
}

/** Pages pode abrir esta URL, mas avaliação e ranking dinâmicos usam google.script.run. */
function doGet(e) {
  const action=String(e && e.parameter && e.parameter.action || "");
  if (action==="ranking") {
    try { return json_({ok:true,ranking:getPublicRanking_()}); }
    catch (err) { return json_({ok:false,error:"ERRO_INTERNO"}); }
  }
  const page=HtmlService.createTemplateFromFile("Index");
  page.initialProjectId=String(e && e.parameter && e.parameter.projectId || "");
  return page.evaluate().setTitle("Universo IF Avalia").addMetaTag("viewport","width=device-width, initial-scale=1");
}

/** Funções públicas chamadas exclusivamente pela interface HTML Service. */
function getProjectsForClient() {
  const rows=ensureSheet_(openSpreadsheet_(),SHEETS.projetos).getDataRange().getValues().slice(1);
  return rows.filter(r=>r[0]).map(r=>({
    id:String(r[0]),titulo:String(r[1]||""),modalidade:String(r[2]||""),
    area_tematica:String(r[3]||""),data:String(r[4]||""),
    inicio:String(r[5]||""),fim:String(r[6]||""),formato:String(r[7]||""),local:String(r[8]||"")
  }));
}
function getRankingForClient() {
  return getPublicRanking_();
}
function submitVoteFromClient(payload) {
  return submitVote_(payload || {});
}

function doPost(e) {
  try {
    const body=JSON.parse(e && e.postData && e.postData.contents || "{}");
    if (body.action!=="submitVote") return json_({ok:false,error:"AÇÃO_INVÁLIDA"});
    return json_(submitVote_(body));
  } catch (err) {
    return json_({ok:false,error:"ERRO_INTERNO"});
  }
}

function submitVote_(body) {
  const token=String(body.code||"").trim();
  const projectId=String(body.projectId||"").trim();
  const requestId=String(body.requestId||"").trim();
  const ratings=body.ratings||{};
  if (!token || token.length>256 || !/^(NAC|EXT)-\d{3}$/.test(projectId) || requestId.length<16 || requestId.length>128) return {ok:false,error:"DADOS_OBRIGATÓRIOS"};
  const values=[ratings.inovacao,ratings.clareza,ratings.relevancia,ratings.demonstracao];
  if (!values.every(n=>Number.isInteger(n) && n>=1 && n<=5)) return {ok:false,error:"NOTAS_INVÁLIDAS"};

  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss=openSpreadsheet_();
    const config=readConfig_(ensureSheet_(ss,SHEETS.config));
    if (config.voting_status!=="OPEN") return {ok:false,error:"VOTAÇÃO_FECHADA"};
    const projectSheet=ensureSheet_(ss,SHEETS.projetos);
    const codeSheet=ensureSheet_(ss,SHEETS.codigos);
    const voteSheet=ensureSheet_(ss,SHEETS.avaliacoes);
    const codeHash=sha256_(token), requestHash=sha256_(requestId);
    const projects=projectSheet.getDataRange().getValues();
    if (!projects.some((r,i)=>i>0 && String(r[0])===projectId)) return {ok:false,error:"PROJETO_INVÁLIDO"};
    const codes=codeSheet.getDataRange().getValues();
    if (!codes.some((r,i)=>i>0 && r[0]===codeHash && (r[1]===true || String(r[1]).toUpperCase()==="TRUE"))) return {ok:false,error:"CÓDIGO_INVÁLIDO"};
    const votes=voteSheet.getDataRange().getValues();
    const previous=votes.find((r,i)=>i>0 && r[0]===requestHash);
    if (previous) {
      const same=previous[1]===codeHash && previous[2]===projectId && values.every((n,i)=>previous[i+3]===n);
      return same ? {ok:true,receipt:previous[8],repeated:true} : {ok:false,error:"ID_REQUISICAO_REUTILIZADO"};
    }
    if (votes.some((r,i)=>i>0 && r[1]===codeHash && r[2]===projectId && r[10]==="VALID")) return {ok:false,error:"VOTO_DUPLICADO"};
    const score=values.reduce((sum,n,i)=>sum+n*WEIGHTS[i],0);
    const receipt=Utilities.getUuid();
    voteSheet.appendRow([requestHash,codeHash,projectId,...values,score,receipt,new Date(),"VALID"]);
    SpreadsheetApp.flush();
    return {ok:true,receipt:receipt,repeated:false};
  } finally {
    lock.releaseLock();
  }
}

/** Retorna somente agregados públicos, nunca códigos, hashes ou linhas individuais. */
function getPublicRanking_() {
  const ss=openSpreadsheet_();
  const projectRows=ensureSheet_(ss,SHEETS.projetos).getDataRange().getValues().slice(1);
  const voteRows=ensureSheet_(ss,SHEETS.avaliacoes).getDataRange().getValues().slice(1);
  const totals=new Map();
  voteRows.forEach(row=>{
    if (row[10]!=="VALID") return;
    const id=String(row[2]||"");
    if (!id) return;
    const current=totals.get(id)||{count:0,sum:0,criteria:[0,0,0,0],updated:null};
    current.count+=1;
    current.sum+=Number(row[7])||0;
    for (let i=0;i<CRITERIA_COUNT;i++) current.criteria[i]+=Number(row[i+3])||0;
    if (row[9] instanceof Date && (!current.updated || row[9]>current.updated)) current.updated=row[9];
    totals.set(id,current);
  });
  const minimum=Math.max(5,Number(readConfig_(ensureSheet_(ss,SHEETS.config)).ranking_minimum)||5);
  const rows=projectRows.filter(r=>r[0]).map(r=>{
    const total=totals.get(String(r[0]))||{count:0,sum:0,criteria:[0,0,0,0],updated:null};
    return {id:String(r[0]),titulo:String(r[1]||""),modalidade:String(r[2]||""),total_avaliacoes:total.count,
      media_ponderada:total.count?round2_(total.sum/total.count):null,
      medias_criterios:total.count?total.criteria.map(v=>round2_(v/total.count)):[null,null,null,null],
      atualizado_em:total.updated?total.updated.toISOString():null};
  });
  const result=[];
  ["Mostra Nacional","Mostra de Extensão"].forEach(modality=>{
    const group=rows.filter(r=>r.modalidade===modality);
    const eligible=group.filter(r=>r.total_avaliacoes>=minimum)
      .sort((a,b)=>b.media_ponderada-a.media_ponderada || a.id.localeCompare(b.id));
    const pending=group.filter(r=>r.total_avaliacoes<minimum)
      .sort((a,b)=>b.total_avaliacoes-a.total_avaliacoes || a.id.localeCompare(b.id));
    eligible.forEach((r,i)=>result.push({...r,colocacao:i+1,status:"CLASSIFICADO"}));
    pending.forEach(r=>result.push({...r,colocacao:null,status:"AGUARDANDO_AMOSTRA_MINIMA"}));
  });
  return result;
}

function openSpreadsheet_() {
  const id=PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Configure SPREADSHEET_ID nas propriedades do script.");
  return SpreadsheetApp.openById(id);
}
function ensureSheet_(ss,definition) {
  let sheet=ss.getSheetByName(definition[0]);
  if (!sheet) sheet=ss.insertSheet(definition[0]);
  if (sheet.getLastRow()===0) sheet.appendRow(definition[1]);
  return sheet;
}
function readConfig_(sheet) {
  const values=sheet.getDataRange().getValues(), out={};
  values.slice(1).forEach(r=>{if(r[0]) out[String(r[0])]=String(r[1]);});
  return out;
}
function sha256_(value) {
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8);
  return bytes.map(b=>("0"+((b+256)%256).toString(16)).slice(-2)).join("");
}
function round2_(value) { return Math.round(value*100)/100; }
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}