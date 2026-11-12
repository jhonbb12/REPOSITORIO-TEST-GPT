# Universo IF Avalia

MVP em desenvolvimento para participação popular educativa nos projetos do IFMA.

## Estado atual

- Branch de trabalho: `feat/universo-if-avalia-mvp`
- Stack: React + Vite + TypeScript + GitHub Pages.
- Catálogo oficial: **pendente de recebimento**. `src/data/projects.json` permanece vazio intencionalmente; não foram inventados registros.
- PDFs de referência: **pendentes de recebimento e conferência**.
- Backend Apps Script: esqueleto inicial em `apps-script/Code.gs`; não implantado.
- Integração navegador ↔ Apps Script: bloqueada até teste real de CORS, acesso anônimo institucional, recibo e readback.
- Publicação e merge: não realizados.

## Requisitos

Node.js 20+ e npm.

```bash
npm ci
npm test
npm run build
npm run audit:catalog
npm run dev
```

O audit do catálogo deve falhar enquanto os 46 registros oficiais não forem adicionados. Preserve exatamente os IDs e os textos das fontes oficiais.

## Variáveis

Crie `.env.local` com `VITE_APPS_SCRIPT_URL` somente após implantação autorizada e validação do endpoint. Não armazene tokens de voto, segredos ou credenciais no frontend.

## Regras de avaliação

Pesos: relevância social 30%, criatividade/inovação 30%, qualidade da execução 25%, clareza da apresentação 15%. Notas inteiras de 1 a 5. O servidor deve recalcular a média ponderada.

## Segurança e homologação

O modelo de participação permite que um código vote em vários projetos, mas apenas uma vez por projeto. A unicidade é o par hash do código + ID do projeto. O backend usa `LockService.getScriptLock()` para serializar a validação e gravação. Não usar IP, MAC, fingerprint ou armazenamento local como identidade.

**Não declare homologado** sem: teste no site público em navegador real, envio válido, recibo, readback no Google Sheets e rejeição de voto duplicado. O Apps Script ContentService não deve ser tratado como API CORS convencional; não usar `no-cors` para simular sucesso.

O ranking exige no mínimo 5 avaliações válidas por projeto. Abaixo disso, exibir “Aguardando amostra mínima”. O produto é educativo e não constitui avaliação oficial ou científica.
