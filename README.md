# Universo IF Avalia

Protótipo acadêmico de participação popular educativa para os projetos do IFMA (2026.2). Não representa julgamento oficial, avaliação científica nem premiação do evento.

## Estado da implementação

- Catálogo oficial v1.0 integrado: **46 projetos (24 Mostra Nacional + 22 Mostra de Extensão)**.
- Fonte versionada no frontend: `public/data/projects.json.gz` (JSON original compactado em gzip; validado no carregamento).
- Interface: catálogo, busca sem acentos, filtros por modalidade/área/dia, detalhes e formulário com prévia ponderada.
- Critérios: criatividade e inovação 30%; clareza da apresentação 30%; relevância e impacto 25%; demonstração e resultados 15%.
- Backend Apps Script: regra de voto por código + projeto, LockService, idempotência, recibo e endpoint agregado de ranking.
- CI: testes, auditoria do catálogo, exportação CSV, build e auditoria de dependências (zero vulnerabilidades no último run concluído). Integração real, planilha e deploy público ainda não homologados.
- Branch de trabalho: `feat/universo-if-avalia-mvp`. `main` não foi alterada.

## Requisitos e comandos

Node.js 20+.

```bash
npm install
npm test
npm run audit:catalog
npm run build
npm run dev
```

## Configuração do catálogo

O arquivo gzip é o JSON consolidado do kit, sem títulos inventados. `npm run export:catalog-csv` gera uma planilha CSV reproduzível para importar os mesmos 46 registros no Google Sheets. A aplicação descompacta e valida o schema ao carregar. Para inspecionar localmente:

```bash
node -e "const fs=require('fs'),z=require('zlib'); console.log(z.gunzipSync(fs.readFileSync('public/data/projects.json.gz')).toString())"
```

Os dois PDFs de origem e a metodologia estão descritos em `docs/AUDITORIA_CATALOGO.md`. As páginas-fonte são exibidas nos detalhes.

## Avaliação

As quatro notas são inteiras de 1 a 5. O backend recalcula a nota ponderada:
`0,30*C1 + 0,30*C2 + 0,25*C3 + 0,15*C4`.
O exemplo [4,5,4,3] resulta em 4,15. A interface não confirma nem envia votos nesta fase porque o fluxo Pages ↔ Apps Script ainda não foi testado em navegador real.

## Regra de participação

Um token autoriza avaliações em vários projetos, mas apenas uma vez por projeto. A unicidade é `(hash_codigo, id_projeto)`; não há uso de IP, MAC, fingerprint ou LocalStorage como identidade. O Apps Script serializa a verificação e gravação com `LockService.getScriptLock()`. O token não prova identidade individual.

## Ranking

Ranking separado por modalidade. Apenas projetos com pelo menos cinco avaliações válidas recebem colocação. Desempate: média ponderada decrescente; persistindo igualdade, ID crescente. O endpoint público retorna agregados, nunca códigos, hashes ou linhas individuais.

## Google e publicação

Siga `docs/CONFIGURAR_GOOGLE.md`. Planilha e administração devem permanecer privadas. Não habilite acesso anônimo nem publique o Web App sem aprovação institucional e teste em planilha de homologação. O GitHub Pages não foi publicado; o workflow exige acionamento manual e confirmação explícita.

## Gates

- G0 GitHub/repositório/branch/autorização: PASS.
- G1 catálogo 46 = 24 + 22, IDs e estrutura: PASS (validador do kit e teste automatizado).
- G2 interface e testes automatizados: PASS para build/testes; QA manual responsivo/acessibilidade ainda pendente.
- G3 código Apps Script e regras: implementado; teste em runtime Google ainda NOT_RUN.
- G4 voto real, recibo, readback e duplicidade: BLOCKED até planilha, implantação e teste real.
- G5 build CI: PASS; publicação GitHub Pages: BLOCKED até aprovação explícita.
- G6 QA independente: NOT_RUN.

Consulte `docs/BACKLOG.md` e `docs/TESTES_E_QA.md` para o estado detalhado.