import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import vm from "node:vm";

class FakeSheet {
  values: unknown[][] = [];
  getLastRow() { return this.values.length; }
  appendRow(row: unknown[]) { this.values.push([...row]); }
  clearContents() { this.values = []; }
  getDataRange() { return { getValues: () => this.values.map(r => [...r]) }; }
  getRange(row: number, col: number, rows: number, cols: number) {
    return {
      setValues: (matrix: unknown[][]) => {
        for (let r=0;r<rows;r++) {
          while (this.values.length < row+r) this.values.push([]);
          for (let c=0;c<cols;c++) this.values[row-1+r][col-1+c]=matrix[r][c];
        }
      },
      setNumberFormat: (_format: string) => undefined,
      setValue: (value: unknown) => {
        while (this.values.length < row) this.values.push([]);
        this.values[row-1][col-1]=value;
      }
    };
  }
}
class FakeSpreadsheet {
  sheets = new Map<string,FakeSheet>();
  getSheetByName(name: string) { return this.sheets.get(name)||null; }
  insertSheet(name: string) { const sheet=new FakeSheet();this.sheets.set(name,sheet);return sheet; }
}
const hash=(value:string)=>createHash("sha256").update(value,"utf8").digest();

function createRuntime() {
  const spreadsheet=new FakeSpreadsheet();
  const cache=new Map<string,{value:string,expires:number}>();
  const context=vm.createContext({
    SpreadsheetApp:{openById:()=>spreadsheet,flush:()=>undefined},
    PropertiesService:{getScriptProperties:()=>({getProperty:()=> "test-sheet"})},
    LockService:{getScriptLock:()=>({waitLock:()=>undefined,releaseLock:()=>undefined})},
    Utilities:{
      DigestAlgorithm:{SHA_256:"SHA_256"},Charset:{UTF_8:"UTF-8"},
      computeDigest:(_algorithm:string,value:string)=>Array.from(hash(value),b=>b>127?b-256:b),
      getUuid:()=>randomUUID(),
      formatDate:(date:Date,_tz:string,_format:string)=>date.toISOString().slice(0,10)
    },
    CacheService:{getScriptCache:()=>({
      get:(key:string)=>{const item=cache.get(key);return item&&item.expires>Date.now()?item.value:null;},
      put:(key:string,value:string,seconds:number)=>cache.set(key,{value,expires:Date.now()+seconds*1000})
    })},
    Session:{getScriptTimeZone:()=>"America/Fortaleza"},
    Date,Map,Set,JSON,Math,Number,String,Array,Object,RegExp,Error,isNaN
  });
  const source=readFileSync("apps-script/Code.gs","utf8");
  vm.runInContext(source,context,{filename:"Code.gs"});
  return {api:context as any,spreadsheet};
}

describe("Apps Script — integração offline com planilha simulada",()=>{
  it("aceita um código em projetos diferentes e bloqueia repetição no mesmo projeto",()=>{
    const {api,spreadsheet}=createRuntime();
    api.setupSheets();
    const projects=spreadsheet.getSheetByName("Projetos")!;
    projects.appendRow(["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes_paginas"]);
    projects.appendRow(["NAC-001","Projeto A","Mostra Nacional","Tecnologia","2026-11-17","09:00","10:00","Exposição de pôster","Área de vivência",""]);
    projects.appendRow(["NAC-002","Projeto B","Mostra Nacional","Tecnologia","2026-11-17","10:00","11:00","Exposição de pôster","Área de vivência",""]);
    const token="token-sintetico-de-teste-32-bytes";
    api.registerCode(token);
    api.setVotingStatus("OPEN");
    const ratings={inovacao:4,clareza:5,relevancia:4,demonstracao:3};
    const first=api.submitVoteFromClient({code:token,projectId:"NAC-001",ratings,requestId:"request-test-00000001"});
    expect(first.ok).toBe(true);
    expect(first.receipt).toBeTruthy();
    const repeated=api.submitVoteFromClient({code:token,projectId:"NAC-001",ratings,requestId:"request-test-00000002"});
    expect(repeated).toEqual({ok:false,error:"VOTO_DUPLICADO"});
    const otherProject=api.submitVoteFromClient({code:token,projectId:"NAC-002",ratings,requestId:"request-test-00000003"});
    expect(otherProject.ok).toBe(true);
    const votes=spreadsheet.getSheetByName("Avaliacoes")!;
    expect(votes.getLastRow()).toBe(3);
    expect(Number(votes.values[1][7])).toBeCloseTo(4.15);
  });

  it("retorna o mesmo recibo para retentativa idempotente sem gravar outra linha",()=>{
    const {api,spreadsheet}=createRuntime();
    api.setupSheets();
    const projects=spreadsheet.getSheetByName("Projetos")!;
    projects.appendRow(["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes_paginas"]);
    projects.appendRow(["EXT-001","Projeto Extensão","Mostra de Extensão","Educação","2026-11-18","09:00","10:00","Exposição de pôster","Área de vivência",""]);
    const token="token-sintetico-idempotente-32-bytes";
    api.registerCode(token);api.setVotingStatus("OPEN");
    const payload={code:token,projectId:"EXT-001",ratings:{inovacao:4,clareza:5,relevancia:4,demonstracao:3},requestId:"request-idempotent-0001"};
    const first=api.submitVoteFromClient(payload);
    const retry=api.submitVoteFromClient(payload);
    expect(retry.ok).toBe(true);
    expect(retry.repeated).toBe(true);
    expect(retry.receipt).toBe(first.receipt);
    expect(spreadsheet.getSheetByName("Avaliacoes")!.getLastRow()).toBe(2);
  });

  it("recusa notas inválidas e mantém a votação fechada por padrão",()=>{
    const {api,spreadsheet}=createRuntime();
    api.setupSheets();
    const projects=spreadsheet.getSheetByName("Projetos")!;
    projects.appendRow(["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes_paginas"]);
    projects.appendRow(["NAC-001","Projeto","Mostra Nacional","Tecnologia","2026-11-17","09:00","10:00","Exposição de pôster","Área de vivência",""]);
    const token="token-sintetico-notas-invalidas-32";
    api.registerCode(token);
    const closed=api.submitVoteFromClient({code:token,projectId:"NAC-001",ratings:{inovacao:4,clareza:5,relevancia:4,demonstracao:3},requestId:"request-closed-0000001"});
    expect(closed.error).toBe("VOTAÇÃO_FECHADA");
    api.setVotingStatus("OPEN");
    const invalid=api.submitVoteFromClient({code:token,projectId:"NAC-001",ratings:{inovacao:4,clareza:5,relevancia:4,demonstracao:6},requestId:"request-invalid-000001"});
    expect(invalid.error).toBe("NOTAS_INVÁLIDAS");
    expect(spreadsheet.getSheetByName("Avaliacoes")!.getLastRow()).toBe(1);
  });
});
