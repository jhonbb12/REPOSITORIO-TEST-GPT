import { useMemo, useState } from "react";
import projectsJson from "./data/projects.json";
import { filterProjects, validateCatalog, type Project } from "./domain/catalog";
import { CRITERIA, RATING_LABELS, weightedScore, type Ratings } from "./domain/scoring";

type Tab = "projects" | "evaluate" | "ranking";
const catalog = projectsJson as Project[];
const catalogAudit = validateCatalog(catalog);
const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

export default function App() {
  const [tab, setTab] = useState<Tab>("projects");
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState("");
  const [area, setArea] = useState("");
  const [day, setDay] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [code, setCode] = useState("");
  const [ratings, setRatings] = useState<Ratings>({ relevancia: 3, inovacao: 3, execucao: 3, apresentacao: 3 });
  const [notice, setNotice] = useState("");

  const areas = useMemo(() => [...new Set(catalog.map(p => p.area_tematica))].sort(), []);
  const days = useMemo(() => [...new Set(catalog.map(p => p.data))].sort(), []);
  const visible = useMemo(() => filterProjects(catalog, query, modality, area, day), [query, modality, area, day]);
  const score = weightedScore(ratings);

  async function submitVote(event: React.FormEvent) {
    event.preventDefault();
    setNotice("");
    if (!selected) return setNotice("Selecione um projeto antes de avaliar.");
    if (!API_URL) return setNotice("Avaliação indisponível: o endpoint institucional ainda não foi configurado e validado.");
    if (!code.trim()) return setNotice("Informe o código de participação fornecido pela organização.");
    setNotice("Envio bloqueado até a validação de CORS e do recibo no site público. Nenhum voto foi registrado.");
  }

  return <div className="app-shell">
    <header className="hero">
      <div className="hero-inner">
        <p className="eyebrow">IFMA · PARTICIPAÇÃO POPULAR EDUCATIVA</p>
        <h1>Universo IF Avalia</h1>
        <p>Conheça os projetos, registre sua avaliação e acompanhe os resultados.</p>
        <span className="notice-pill">MVP em homologação</span>
      </div>
    </header>
    <nav className="tabs" aria-label="Navegação principal">
      {(["projects", "evaluate", "ranking"] as Tab[]).map((item) =>
        <button key={item} className={tab === item ? "tab active" : "tab"} onClick={() => { setTab(item); setNotice(""); }}>
          {item === "projects" ? "Projetos" : item === "evaluate" ? "Avaliar" : "Ranking"}
        </button>
      )}
    </nav>
    <main className="content">
      {tab === "projects" && <>
        <section className="section-heading"><div><p className="eyebrow">CATÁLOGO</p><h2>Projetos participantes</h2></div><span className="count">{catalog.length} / 46</span></section>
        {!catalogAudit.valid && <div className="alert" role="status">
          <strong>Catálogo oficial pendente.</strong>
          <p>O arquivo JSON validado com os 46 projetos ainda não foi recebido. A listagem está vazia de propósito; nenhum projeto fictício foi inserido.</p>
        </div>}
        <div className="filters">
          <label className="search-label">Buscar<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome, código, área ou local" /></label>
          <label>Modalidade<select value={modality} onChange={e => setModality(e.target.value)}><option value="">Todas</option><option value="NAC">Mostra Nacional</option><option value="EXT">Extensão</option></select></label>
          <label>Área temática<select value={area} onChange={e => setArea(e.target.value)}><option value="">Todas</option>{areas.map(a => <option key={a}>{a}</option>)}</select></label>
          <label>Dia<select value={day} onChange={e => setDay(e.target.value)}><option value="">Todos</option>{days.map(d => <option key={d}>{d}</option>)}</select></label>
        </div>
        <div className="empty-state"><span className="empty-mark">◎</span><h3>{visible.length ? "Projetos encontrados" : "Aguardando catálogo oficial"}</h3><p>{visible.length ? `${visible.length} projeto(s) correspondem aos filtros.` : "Assim que o JSON oficial for disponibilizado, os projetos aparecerão aqui com seus dados originais."}</p></div>
        {visible.map(project => <article className="project-card" key={project.id}><div><span className="project-id">{project.id}</span><h3>{project.titulo}</h3><p>{project.area_tematica} · {project.modalidade}</p></div><button onClick={() => setSelected(project)}>Detalhes</button></article>)}
        {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-label="Detalhes do projeto" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSelected(null)} aria-label="Fechar">×</button><p className="project-id">{selected.id}</p><h2>{selected.titulo}</h2><p>{selected.area_tematica} · {selected.modalidade}</p><dl>{[["Data",selected.data],["Horário",selected.inicio+"–"+selected.fim],["Formato",selected.formato],["Local",selected.local]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><h3>Fontes</h3>{selected.fontes.map(f=><p key={f}>{f}</p>)}</section></div>}
      </>}
      {tab === "evaluate" && <section><p className="eyebrow">PARTICIPAÇÃO</p><h2>Avaliar um projeto</h2><p className="muted">As notas são inteiras de 1 a 5. O cálculo final é refeito pelo servidor.</p>
        <form className="evaluation-form" onSubmit={submitVote}>
          <label>Projeto<select value={selected?.id ?? ""} onChange={e => setSelected(catalog.find(p => p.id === e.target.value) ?? null)}><option value="">Selecione um projeto</option>{catalog.map(p=><option key={p.id} value={p.id}>{p.id} — {p.titulo}</option>)}</select></label>
          <label>Código de participação<input type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} placeholder="Código fornecido pela organização" /></label>
          {CRITERIA.map(c=><fieldset key={c.id}><legend>{c.label} <small>({Math.round(c.weight*100)}%)</small></legend><div className="rating-options">{[1,2,3,4,5].map(n=><label key={n}><input type="radio" name={c.id} checked={ratings[c.id]===n} onChange={()=>setRatings(old=>({...old,[c.id]:n}))}/><span>{n}</span></label>)}</div><small>{RATING_LABELS[ratings[c.id]]}</small></fieldset>)}
          <div className="score-preview"><span>Prévia ponderada</span><strong>{score.toFixed(2).replace(".",",")} / 5</strong></div>
          <button className="primary" type="submit">Enviar avaliação</button>
          {notice && <p className="form-notice" role="status">{notice}</p>}
        </form>
      </section>}
      {tab === "ranking" && <section><p className="eyebrow">RESULTADOS</p><h2>Ranking de projetos</h2><p className="muted">A colocação exige pelo menos 5 avaliações válidas por projeto. Resultados abaixo da amostra mínima não recebem posição.</p><div className="empty-state"><span className="empty-mark">≋</span><h3>Aguardando avaliações</h3><p>O ranking será calculado com médias ponderadas no servidor, com desempate determinístico e amostra mínima de 5 votos.</p></div></section>}
      <footer><p>O Universo IF Avalia é uma iniciativa de participação popular educativa. Não representa avaliação oficial, científica ou institucional dos projetos.</p></footer>
    </main>
  </div>;
}