# Relatório de execução — Universo IF Avalia

Atualização: 14/11/2026. Escopo desta revisão: branch da equipe, backend Apps Script, fluxo de avaliação/ranking, testes e bloqueios manuais.

## Repositório e governança

- Repositório público: https://github.com/jhonbb12/REPOSITORIO-TEST-GPT
- Branch de trabalho: feat/universo-if-avalia-mvp
- Pull Request: https://github.com/jhonbb12/REPOSITORIO-TEST-GPT/pull/1
- PR permanece aberta e Draft; sem merge.
- main permanece intacta.
- Repositório de referência do professor não foi modificado.
- Último commit de código verificado pelo CI: 519884acda32fecda60d39da72018c3cbdb2c863. Os commits seguintes desta revisão atualizaram somente documentação; a execução CI correspondente deve ser conferida no histórico do workflow.

## Entregas implementadas

1. Aplicação React + Vite + TypeScript e catálogo compactado/validado.
2. Catálogo de 46 projetos únicos: 24 Mostra Nacional e 22 Mostra de Extensão.
3. Busca acento-insensível, filtros, detalhes e navegação de catálogo.
4. Critérios de avaliação 30/30/25/15 e cálculo ponderado no servidor.
5. Apps Script com abas Projetos, Codigos, Avaliacoes e Configuracao.
6. Regra Modelo B: unicidade por hash do token + projeto; LockService, idempotência e recibo.
7. Importador administrativo importProjectsFromCatalog(), que obtém o JSON gzip do commit imutável, valida 46/24/22 e não sobrescreve catálogo se houver avaliações.
8. Interface dinâmica de avaliação e ranking no HTML Service, usando google.script.run; o Pages direciona para essa tela, evitando depender de CORS para o envio.
9. Limitação de tentativas inválidas por hash de token, sem coleta de IP/MAC/fingerprint.
10. Testes automatizados offline do Apps Script em planilha simulada.

## Evidência de CI

Workflow: https://github.com/jhonbb12/REPOSITORIO-TEST-GPT/actions/runs/43543659923

Resultado: success no commit 519884acda32fecda60d39da72018c3cbdb2c863.

Etapas aprovadas: npm install, npm audit --audit-level=high, npm test, auditoria do catálogo, exportação CSV (47 linhas incluindo cabeçalho), build TypeScript/Vite e upload do artefato Pages. O job deploy foi ignorado conforme a regra do workflow: não houve publicação.

## Gates

| Gate | Estado | Evidência / bloqueio |
|---|---|---|
| G0 GitHub, repositório, branch e autorização | PASS | Integração conectada; branch e PR identificadas |
| G1 Catálogo íntegro | PASS | 46 IDs únicos, 24+22; validador e testes automatizados |
| G2 Interface, domínio, build e testes | PASS parcial | CI aprovado; QA manual de dispositivos e WCAG ainda não executado |
| G3 Backend e regra B offline | PASS parcial | Testes Apps Script simulados aprovados; runtime Google e planilha real ainda não testados |
| G4 Voto real, recibo, readback e duplicidade | BLOCKED_CONNECTED_VOTE | Depende da implantação e autorização de teste no Google |
| G5 GitHub Actions / Pages | PASS build; BLOCKED_DEPLOY | Build e artefato aprovados; Pages não publicado por restrição explícita |
| G6 QA independente | NOT_RUN | Outro integrante precisa conferir 10 projetos e testar em smartphone |

## Ações manuais restantes

1. No projeto Apps Script vinculado à planilha privada correta, atualizar Code.gs com apps-script/Code.gs, criar/atualizar Index.html com apps-script/Index.html e aplicar apps-script/appsscript.json.
2. Confirmar a propriedade SPREADSHEET_ID e executar setupSheets() se necessário.
3. Executar importProjectsFromCatalog() no editor Apps Script e conferir 46 linhas na aba Projetos (24 Nacional, 22 Extensão). Não executar sobre uma planilha que já contenha avaliações.
4. Revisar escopos e avisos do Google. A planilha e as abas Codigos/Avaliacoes devem permanecer privadas.
5. Somente após autorização específica, registrar token sintético, abrir votação em planilha de homologação, implantar o Web App com acesso anônimo se a política institucional permitir, testar o envio e fechar novamente a votação.
6. Configurar VITE_APPS_SCRIPT_URL nas variáveis de GitHub Actions com a URL /exec do Web App; não colocar tokens ou dados de votação nessa variável.
7. Somente após aprovação explícita, publicar GitHub Pages. O workflow deve ser executado a partir de main com publish=true; isso permanece intencionalmente bloqueado.
8. Testar o fluxo em janela anônima e smartphone: voto válido, recibo, readback, repetição recusada, mesmo código em outro projeto aceito e ranking atualizado.
9. Outro integrante deve conferir pelo menos 10 projetos contra os PDFs/JSON e registrar QA independente; testar larguras 320, 375, 768 e 1280 px, teclado e foco visível.

## Critério de encerramento

O resultado atual é MVP implementado e CI aprovado, pronto para revisão técnica assistida. Não é PUBLICADO_HOMOLOGADO. Essa classificação só muda após o teste público real, recibo confiável, readback na planilha e bloqueio efetivo do segundo voto, além dos gates de publicação e QA.
