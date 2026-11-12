# Testes e QA

## Automatizados

Com Node.js 20+:

```bash
npm install
npm test
npm run audit:catalog
npm run build
```

O exportador deve gerar 47 linhas no CSV (cabeçalho + 46 projetos). O pipeline valida essa contagem.\n\nCobertura atual:
- 46 registros, 24 nacionais e 22 extensão;
- IDs estáveis, unicidade e títulos AGROSENTINELA / TRAÇO VIVO separados;
- busca sem acentos sem modificar títulos originais;
- filtro por modalidade;
- soma dos pesos e caso `[4,5,4,3] = 4,15`;
- rejeição de notas ausentes, decimais e fora da faixa.

## Roteiro manual pendente

1. Abrir catálogo em 320, 375, 768 e 1280 px.
2. Buscar por termo com e sem acento; testar modalidade, área e data.
3. Abrir detalhes e confirmar páginas-fonte.
4. Navegar por teclado; verificar foco visível, rótulos, contraste e alvos de toque.
5. Testar Chrome Android e Safari iOS quando disponíveis.
6. Configurar planilha privada e Apps Script de homologação.
7. Enviar [4,5,4,3] e conferir 4,15 calculado no servidor.
8. Mesmo código + projeto A: primeiro envio aceito; segundo envio recusado.
9. Mesmo código + projeto B: aceito.
10. Duas requisições concorrentes para o mesmo par: exatamente uma linha válida.
11. Reutilizar o mesmo `id_requisicao` com payload idêntico: devolver mesmo recibo; com payload diferente: recusar.
12. Verificar ranking separado por modalidade, médias por critério, atualização e amostra mínima de cinco.
13. Conferir que a resposta pública não contém tokens, hashes, nem linhas individuais.
14. Repetir fluxo em navegador anônimo no endereço Pages e fazer readback na planilha.

## Estado da evidência

- Validador oficial do kit: PASS.
- Testes locais via CI: PASS no commit anterior ao último conjunto de alterações; nova execução em andamento/pendente.
- Build: PASS no commit anterior ao último conjunto de alterações; nova execução pendente.
- QA manual em dispositivos: NOT_RUN.
- Teste de Apps Script no runtime Google: NOT_RUN.
- CORS, recibo e readback público: BLOCKED.
- QA independente por outro integrante: NOT_RUN.

WCAG 2.2 AA é referência, não certificação. Não declarar conformidade sem inspeção manual e testes com tecnologias assistivas.
