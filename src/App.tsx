import { useEffect, useMemo, useState, type FormEvent } from "react";
import { filterProjects, validateCatalog, type Project } from "./domain/catalog";
import { CRITERIA, RATING_LABELS, weightedScore, type Ratings } from "./domain/scoring";

type Tab = "projects" | "evaluate" | "ranking";
type RankingRow = {
  id: string; titulo: string; modalidade: string; total_avaliacoes: number;
  media_ponderada: number | null; medias_criterios: number[]; colocacao: number | null;
  status: string; atualizado_em: string | null;
};
const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

export default function App() {
  const [tab,setTab] = useState<Tab>("projects");
  const [catalog,setCatalog] = useState<Project[]>([]);
  const [catalogState,setCatalogState] = useState<"loading"|"ready"|"error">("loading");
  const [catalogError,setCatalogError] = useState("");
  const [query,setQuery] = useState("");
  const [modality,setModality] = useState("");
  const [area,setArea] = useState("");
  const [day,setDay] = useState("");
  const [selectedId,setSelectedId] = useState("");
  const [code,setCode] = useState("");
  const [ratings,setRatings] = useState<Ratings>({inovacao:3,clareza:3,relevancia:3,demonstracao:3});
  const [notice,setNotice] = useState("");
  const [rankingModality,setRankingModality] = useState<"NAC"|"EXT">("NAC");
  const [ranking,setRanking] = useState<RankingRow[]>([]);
  const [rankingState,setRankingState] = useState<"idle"|"loading"|"ready"|"error">("idle");

  useEffect(() => {
    let active=true;
    async function loadCatalog() {
      try {
        const response=await fetch(`${import.meta.env.BASE_URL}data/projects.json.gz`);
        if (!response.ok || !response.body) throw new Error("Não foi possível carregar o catálogo versionado.");
        const stream=response.body.pipeThrough(new DecompressionStream("gzip"));
        const raw=await new Response(stream).json() as unknown;
        const audit=validateCatalog(raw);
        if (!audit.valid) throw new Error(audit.errors.join(" "));
        if (active) {
          setCatalog((raw as {projetos:Project[]}).projetos);
          setCatalogState("ready");
        }
      } catch (error) {
        if (active) {
          setCatalogError(error instanceof Error ? error.message : "Falha desconhecida ao ler o catálogo.");
          setCatalogState("error");
        }
      }
    }
    void loadCatalog();
    return () => { active=false; };
  },[]);

  useEffect(() => {
    if (tab !== "ranking") return;
    if (!API_URL) { setRankingState("error"); return; }
    let active=true;
    setRankingState("loading");
    fetch(`${API_URL}?action=ranking`)
      .then(r => { if (!r.ok) throw new Error("Falha ao consultar ranking."); return r.json(); })
      .then(data => {
        if (!data.ok || !Array.isArray(data.ranking)) throw new Error("Resposta de ranking inválida.");
        if (active) { setRanking(data.ranking as RankingRow[]); setRankingState("ready"); }
      })
      .catch(() => { if (active) setRankingState("error"); });
    return () => { active=false; };
  },[tab]);

  const areas=useMemo(()=>[...new Set(catalog.map(p=>p.area_tematica))].sort((a,b)=>a.localeCompare(b,"pt-BR")),[catalog]);
  const days=useMemo(()=>[...new Set(catalog.map(p=>p.data))].sort(),[catalog]);
  const visible=useMemo(()=>filterProjects(catalog,query,modality,area,day),[catalog,query,modality,area,day]);
  const selected=catalog.find(p=>p.id===selectedId) ?? null;
  const score=weightedScore(ratings);
  const filteredRanking=ranking.filter(r=>r.modalidade===(rankingModality==="NAC"?"Mostra Nacional":"Mostra de Extensão"));

  function openEvaluation(projectId:string) {
    setSelectedId(projectId);
    setNotice("");
    setTab("evaluate");
  }
  function submitVote(event:FormEvent) {
    event.preventDefault();
    setNotice("");
    if (!selected) return setNotice("Selecione um projeto válido antes de avaliar.");
    if (!code.trim()) return setNotice("Informe o código fornecido pela organização.");
    setNotice(API_URL
      ? "Envio desabilitado nesta versão até a homologação do fluxo CORS, recibo e readback no Google Sheets. Nenhum voto foi enviado."
      : "Avaliação ainda não conectada ao Apps Script. Nenhum voto foi enviado.");
  }

  return <div className="app-shell">
    <header className="hero"><div className="hero-inner">
      <p className="eyebrow">IFMA · PARTICIPAÇÃO POPULAR EDUCATIVA</p>
      <h1>Universo IF Avalia</h1>
      <p>Conheça os projetos, registre sua avaliação e acompanhe os resultados.</p>
      <span className="notice-pill">Protótipo acadêmico · em homologação</span>
    </div></header>
    <nav className="tabs" aria-label="Navegação principal">
      {(["projects","evaluate","ranking"] as Tab[]).map(item=><button key={item} className={tab===item?"tab active":"tab"} aria-current={tab===item?"page":undefined} onClick={()=>{setTab(item);setNotice("");}}>
        {item==="projects"?"Projetos":item==="evaluate"?"Avaliar":"Ranking"}
      </button>)}
    </nav>
    <main className="content">
      {tab==="projects" && <>
        <section className="section-heading"><div><p className="eyebrow">CATÁLOGO OFICIAL · VERSÃO 1.0</p><h2>Projetos participantes</h2></div><span className="count">{catalogState==="ready"?catalog.length:"—"} / 46</span></section>
        {catalogState==="loading" && <div className="empty-state" role="status"><h3>Carregando catálogo…</h3><p>Validando os dados versionados.</p></div>}
        {catalogState==="error" && <div className="alert" role="alert"><strong>Não foi possível abrir o catálogo.</strong><p>{catalogError}</p></div>}
        {catalogState==="ready" && <>
          <div className="filters">
            <label className="search-label">Buscar projeto<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Título, código, área ou local"/></label>
            <label>Modalidade<select value={modality} onChange={e=>setModality(e.target.value)}><option value="">Todas</option><option value="NAC">Mostra Nacional</option><option value="EXT">Mostra de Extensão</option></select></label>
            <label>Área temática<select value={area} onChange={e=>setArea(e.target.value)}><option value="">Todas</option>{areas.map(a=><option key={a} value={a}>{a}</option>)}</select></label>
            <label>Dia<select value={day} onChange={e=>setDay(e.target.value)}><option value="">Todos</option>{days.map(d=><option key={d} value={d}>{new Date(d+"T12:00:00").toLocaleDateString("pt-BR")}</option>)}</select></label>
          </div>
          <p className="muted">{visible.length} de {catalog.length} projetos</p>
          {visible.length===0 && <div className="empty-state"><h3>Nenhum projeto encontrado</h3><p>Altere os filtros ou o termo de busca.</p></div>}
          {visible.map(project=><article className="project-card" key={project.id}>
            <div><span className="project-id">{project.id} · {project.modalidade}</span><h3>{project.titulo}</h3><p>{project.area_tematica}</p><p>{new Date(project.data+"T12:00:00").toLocaleDateString("pt-BR")} · {project.inicio}–{project.fim} · {project.local}</p></div>
            <div className="card-actions"><button onClick={()=>setSelectedId(project.id)}>Detalhes</button><button className="primary small" onClick={()=>openEvaluation(project.id)}>Avaliar</button></div>
          </article>)}
        </>}
        {selected && tab==="projects" && <div className="modal-backdrop" role="presentation" onClick={()=>setSelectedId("")}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="project-title" onClick={e=>e.stopPropagation()}>
            <button className="close" onClick={()=>setSelectedId("")} aria-label="Fechar">×</button>
            <p className="project-id">{selected.id} · {selected.modalidade}</p><h2 id="project-title">{selected.titulo}</h2><p>{selected.area_tematica}</p>
            <dl>{[["Data",new Date(selected.data+"T12:00:00").toLocaleDateString("pt-BR")],["Horário",selected.inicio+"–"+selected.fim],["Formato",selected.formato],["Local",selected.local]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <h3>Fontes da programação</h3>{selected.fontes.map((source,i)=><p key={i}>{source.arquivo} · página {source.pagina}</p>)}
            <button className="primary" onClick={()=>openEvaluation(selected.id)}>Avaliar este projeto</button>
          </section>
        </div>}
      </>}
      {tab==="evaluate" && <section>
        <p className="eyebrow">PARTICIPAÇÃO</p><h2>Avaliar um projeto</h2>
        <p className="muted">Cada código permite avaliar vários projetos, mas somente uma vez cada projeto. O servidor deverá validar novamente as quatro notas.</p>
        <form className="evaluation-form" onSubmit={submitVote}>
          <label>Projeto<select value={selectedId} onChange={e=>setSelectedId(e.target.value)} required><option value="">Selecione um projeto</option>{catalog.map(p=><option key={p.id} value={p.id}>{p.id} — {p.titulo}</option>)}</select></label>
          <label>Código de participação<input type="password" autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} placeholder="Código fornecido pela organização" required/></label>
          {CRITERIA.map(c=><fieldset key={c.id}><legend>{c.label} <small>({Math.round(c.weight*100)}%)</small></legend><div className="rating-options">{[1,2,3,4,5].map(n=><label key={n}><input type="radio" name={c.id} checked={ratings[c.id]===n} onChange={()=>setRatings(old=>({...old,[c.id]:n}))}/><span>{n}</span></label>)}</div><small>{RATING_LABELS[ratings[c.id]]}</small></fieldset>)}
          <div className="score-preview"><span>Prévia ponderada</span><strong>{score.toFixed(2).replace(".",",")} / 5</strong></div>
          <button className="primary" type="submit">Enviar avaliação</button>
          {notice && <p className="form-notice" role="status">{notice}</p>}
        </form>
      </section>}
      {tab==="ranking" && <section>
        <p className="eyebrow">RESULTADOS AGREGADOS</p><h2>Ranking de projetos</h2>
        <p className="muted">A classificação é separada por modalidade e exige pelo menos cinco avaliações válidas. Empates são resolvidos pela média descendente e, persistindo, pelo ID em ordem crescente.</p>
        <label className="ranking-filter">Modalidade<select value={rankingModality} onChange={e=>setRankingModality(e.target.value as "NAC"|"EXT")}><option value="NAC">Mostra Nacional</option><option value="EXT">Mostra de Extensão</option></select></label>
        {rankingState==="loading" && <div className="empty-state" role="status"><h3>Consultando resultados…</h3></div>}
        {rankingState==="error" && <div className="empty-state"><h3>Ranking ainda não disponível</h3><p>O endpoint agregado do Apps Script ainda não foi conectado e homologado.</p></div>}
        {rankingState==="ready" && filteredRanking.map(row=><article className="project-card" key={row.id}><div><span className="project-id">{row.colocacao?"#"+row.colocacao:"Aguardando amostra mínima"} · {row.id}</span><h3>{row.titulo}</h3><p>{row.total_avaliacoes} avaliações · {row.media_ponderada===null?"—":row.media_ponderada.toFixed(2).replace(".",",")+"/5"}</p></div></article>)}
      </section>}
      <footer><p>O Universo IF Avalia é um protótipo de participação popular educativa. Não representa avaliação oficial, científica ou institucional dos projetos. A programação pode sofrer alterações pela organização do evento.</p></footer>
    </main>
  </div>;
}