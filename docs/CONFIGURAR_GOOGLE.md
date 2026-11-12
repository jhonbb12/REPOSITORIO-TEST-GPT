# Configurar Google Sheets e Apps Script

Esta etapa ainda não foi executada. Use uma planilha de teste da equipe; não use planilha pública nem dados pessoais.

## 1. Criar a planilha privada

1. Crie uma planilha Google na conta da equipe e mantenha o compartilhamento restrito aos responsáveis.
2. Abra Extensões → Apps Script.
3. Substitua o conteúdo do editor pelo arquivo `apps-script/Code.gs`.
4. Em Configurações do projeto → Propriedades do script, crie `SPREADSHEET_ID` com o ID da planilha (trecho entre `/d/` e `/edit` na URL).
5. Salve e execute `setupSheets()`. Autorize apenas os escopos solicitados pelo Google.

## 2. Preencher a aba Projetos

A aba `Projetos` deve conter os 46 registros do CSV oficial do kit. Importe `universo_if_catalogo_46_projetos_v1.0.csv` para a aba, substituindo seu conteúdo. Preserve a ordem das colunas do CSV: `id`, `titulo`, `modalidade`, `area_tematica`, `data`, `inicio`, `fim`, `formato`, `local`, `fontes_paginas`. O backend lê as três primeiras colunas para validar projetos e montar o ranking; as demais preservam metadados públicos. Não altere IDs ou títulos.

## 3. Registrar códigos de teste

Gere tokens aleatórios de alta entropia (mínimo recomendado: 24 caracteres; prefira 32 bytes aleatórios em formato hexadecimal). No editor Apps Script, execute manualmente `registerCode("TOKEN_DE_TESTE")` para cada token. O script armazena somente SHA-256. Não coloque tokens no GitHub, em URLs, logs ou mensagens públicas. A aba `Codigos` e a planilha inteira devem permanecer privadas.

## 4. Estado da votação

`setupSheets()` inicializa `voting_status=CLOSED`, `ranking_minimum=5` e `catalog_version=1.0`. Mantenha a votação fechada durante a configuração. A função administrativa `setVotingStatus("OPEN")` só deve ser executada após revisão, teste em planilha de homologação e autorização explícita. Para fechar, execute `setVotingStatus("CLOSED")`.

## 5. Implantar como Web App — somente após autorização

1. Implante → Nova implantação → Tipo: Aplicativo da web.
2. Executar como: proprietário que implantou.
3. Acesso: qualquer pessoa, inclusive anônima, **somente se a política institucional e a conta permitirem**.
4. Se o acesso anônimo não estiver disponível, não contorne a política: marque `BLOQUEADO_ACESSO_PUBLICO` e use demonstração local/manual.
5. Não publique a planilha nem conceda acesso público a ela.

O endpoint GET `?action=ranking` retorna somente agregados. O POST `action=submitVote` valida token, projeto, notas, estado, duplicidade e grava sob `LockService`.

## 6. CORS e homologação obrigatória

Apps Script ContentService não é uma API CORS convencional. Não use `mode: "no-cors"`, não considere envio de requisição como sucesso e nunca mostre confirmação sem recibo do servidor. O frontend atual mantém o envio desabilitado até o teste real.

Teste no endereço Pages, em janela anônima e em smartphone: GET do ranking, POST válido, recibo, readback na aba `Avaliacoes`, segundo voto do mesmo código no mesmo projeto recusado e mesmo código em outro projeto aceito. Se a comunicação direta falhar, use o fallback do prompt: telas dinâmicas hospedadas no HTML Service com `google.script.run`, mantendo o catálogo e a navegação principal no Pages. Não use `ALLOWALL` sem mitigação de clickjacking.

## Abas

- `Projetos`: catálogo público versionado.
- `Codigos`: hashes de tokens e estado; privado.
- `Avaliacoes`: hash do código, hash de requisição, projeto, notas, média, recibo, timestamp e estado; privado.
- `Configuracao`: status, mínimo do ranking e versão do catálogo.
