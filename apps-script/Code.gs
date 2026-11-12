/**
 * Universo IF Avalia — backend Google Apps Script (modelo inicial).
 * Configure Script Properties: SPREADSHEET_ID.
 * Não publicar como API antes dos testes de CORS, acesso institucional e concorrência.
 */
const SHEETS = {
  projetos: ["Projetos", ["id_projeto", "titulo", "modalidade"]],
  codigos: ["Codigos", ["hash_codigo", "ativo", "criado_em"]],
  avaliacoes: ["Avaliacoes", ["id_requisicao", "hash_codigo", "id_projeto", "c1", "c2", "c3", "c4", "nota_ponderada", "recibo", "criado_em"]],
  config: ["Configuracao", ["chave", "valor"]]
};
const WEIGHTS = [0.30, 0.30, 0.25, 0.15];

function setupSheets() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Configure SPREADSHEET_ID nas propriedades do script.");
  const ss = SpreadsheetApp.openById(spreadsheetId);
  Object.values(SHEETS).forEach(definition => ensureSheet_(ss, definition));
  return "Abas verificadas.";
}

function doGet(e) {
  const action = String(e?.parameter?.action || "");
  if (action !== "ranking") return json_({ ok: false, error: "AÇÃO_INVÁLIDA" });
  try {
    return json_({ ok: true, ranking: getPublicRanking_() });
  } catch (err) {
    return json_({ ok: false, error: "ERRO_INTERNO" });
  }
}

function getPublicRanking_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("SPREADSHEET_ID não configurado");
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const projects = ensureSheet_(ss, SHEETS.projetos).getDataRange().getValues().slice(1);
  const votes = ensureSheet_(ss, SHEETS.avaliacoes).getDataRange().getValues().slice(1);
  const totals = new Map();
  votes.forEach(row => {
    const id = String(row[2] || "");
    if (!id) return;
    const current = totals.get(id) || { count: 0, sum: 0 };
    current.count += 1;
    current.sum += Number(row[7]) || 0;
    totals.set(id, current);
  });
  const rows = projects.filter(row => row[0]).map(row => {
    const total = totals.get(String(row[0])) || { count: 0, sum: 0 };
    return {
      id: String(row[0]),
      titulo: String(row[1] || ""),
      modalidade: String(row[2] || ""),
      total_avaliacoes: total.count,
      media_ponderada: total.count ? Math.round((total.sum / total.count) * 100) / 100 : null
    };
  });
  const result = [];
  ["NAC", "EXT"].forEach(modality => {
    const group = rows.filter(row => row.modalidade === modality);
    const eligible = group.filter(row => row.total_avaliacoes >= 5)
      .sort((a, b) => b.media_ponderada - a.media_ponderada || a.id.localeCompare(b.id));
    const pending = group.filter(row => row.total_avaliacoes < 5)
      .sort((a, b) => b.total_avaliacoes - a.total_avaliacoes || a.id.localeCompare(b.id));
    eligible.forEach((row, index) => result.push({ ...row, colocacao: index + 1, status: "CLASSIFICADO" }));
    pending.forEach(row => result.push({ ...row, colocacao: null, status: "AGUARDANDO_AMOSTRA_MINIMA" }));
  });
  return result;
}

function doPost(e) {
  try {
    const body = JSON.parse(e?.postData?.contents || "{}");
    if (body.action !== "submitVote") return json_({ ok: false, error: "AÇÃO_INVÁLIDA" });
    return json_(submitVote_(body));
  } catch (err) {
    return json_({ ok: false, error: "ERRO_INTERNO" });
  }
}

function submitVote_(body) {
  const token = String(body.code || "").trim();
  const projectId = String(body.projectId || "").trim();
  const requestId = String(body.requestId || "").trim();
  const ratings = body.ratings || {};
  if (!token || !projectId || !requestId) return { ok: false, error: "DADOS_OBRIGATÓRIOS" };
  const values = [ratings.relevancia, ratings.inovacao, ratings.execucao, ratings.apresentacao];
  if (!values.every(n => Number.isInteger(n) && n >= 1 && n <= 5)) return { ok: false, error: "NOTAS_INVÁLIDAS" };
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("SPREADSHEET_ID não configurado");
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const codeHash = sha256_(token);
    const requestHash = sha256_(requestId);
    const projectSheet = ensureSheet_(ss, SHEETS.projetos);
    const codeSheet = ensureSheet_(ss, SHEETS.codigos);
    const voteSheet = ensureSheet_(ss, SHEETS.avaliacoes);
    const projectExists = projectSheet.getDataRange().getValues().some((r, i) => i > 0 && r[0] === projectId);
    if (!projectExists) return { ok: false, error: "PROJETO_INVÁLIDO" };
    const codeRows = codeSheet.getDataRange().getValues();
    const codeIndex = codeRows.findIndex((r, i) => i > 0 && r[0] === codeHash && r[1] === true);
    if (codeIndex < 0) return { ok: false, error: "CÓDIGO_INVÁLIDO" };
    const votes = voteSheet.getDataRange().getValues();
    const priorRequest = votes.find((r, i) => i > 0 && r[0] === requestHash);
    if (priorRequest) {
      const samePayload = priorRequest[1] === codeHash && priorRequest[2] === projectId &&
        values.every((n, i) => priorRequest[i + 3] === n);
      return samePayload
        ? { ok: true, receipt: priorRequest[8], repeated: true }
        : { ok: false, error: "ID_REQUISICAO_REUTILIZADO" };
    }
    const duplicate = votes.some((r, i) => i > 0 && r[1] === codeHash && r[2] === projectId);
    if (duplicate) return { ok: false, error: "VOTO_DUPLICADO" };
    const score = values.reduce((sum, n, i) => sum + n * WEIGHTS[i], 0);
    const receipt = Utilities.getUuid();
    voteSheet.appendRow([requestHash, codeHash, projectId, ...values, score, receipt, new Date()]);
    SpreadsheetApp.flush();
    return { ok: true, receipt, repeated: false };
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet_(ss, definition) {
  let sheet = ss.getSheetByName(definition[0]);
  if (!sheet) sheet = ss.insertSheet(definition[0]);
  if (sheet.getLastRow() === 0) sheet.appendRow(definition[1]);
  return sheet;
}

function sha256_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(b => ("0" + ((b + 256) % 256).toString(16)).slice(-2)).join("");
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
