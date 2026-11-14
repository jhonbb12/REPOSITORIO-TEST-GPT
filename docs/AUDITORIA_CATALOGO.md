# Auditoria do catálogo v1.0

## Resultado

**PASS — 46 registros únicos: 24 Mostra Nacional e 22 Mostra de Extensão.**

- Schema: `universo-if-catalogo-v1.0`.
- IDs estáveis: `NAC-001…NAC-024` e `EXT-001…EXT-022`.
- Datas limitadas a 17 e 18/11/2026.
- Local comum: `Área de vivência`.
- Formato comum: `Exposição de pôster`.
- Cada projeto possui uma ou mais referências de arquivo e página.
- Não há duplicidade de título dentro da mesma modalidade.
- `AGROSENTINELA` e `TRAÇO VIVO` permanecem como projetos distintos da Mostra Nacional (`NAC-004` e `NAC-005`).

## Arquivos de origem

1. `trabalhos-mostra-nacional-extensao.pdf`: 5 páginas; contém 22 trabalhos de extensão e 24 nacionais.
2. `trabalhos-mostra-nacional.pdf`: 3 páginas; apresenta a Mostra Nacional, sobreposta à listagem nacional do primeiro PDF.

Os hashes SHA-256 de todos os arquivos listados em `SHA256SUMS.txt` do kit foram conferidos e correspondem aos valores fornecidos. O validador do próprio kit foi executado: PASS. Os PDFs foram abertos e suas páginas renderizadas para inspeção visual; o conteúdo é imagem, sem camada de texto pesquisável.

## Método e limitações

O JSON do kit é a fonte de dados versionada no frontend. A auditoria fornecida no kit descreve transcrição visual manual, cruzamento das 24 entradas nacionais entre os PDFs e manutenção de uma única linha por trabalho. A inspeção visual confirma a estrutura das páginas e a repetição da listagem nacional nas duas fontes. A conferência visual integral, linha a linha, dos 46 títulos ainda deve ser feita por outra pessoa da equipe antes da apresentação final; há risco residual de erro de transcrição.

Campos ausentes nas fontes e não inventados: autores, resumos, imagens, links individuais, presença e coordenadas exatas dos pôsteres. As fontes são fotografias da programação e não garantem alterações de última hora.

## Distribuição

| Modalidade | 17/11 | 18/11 | Total |
|---|---:|---:|---:|
| Mostra de Extensão | 13 | 9 | 22 |
| Mostra Nacional | 12 | 12 | 24 |
| **Total** | **25** | **21** | **46** |

O catálogo está incorporado ao frontend em `public/data/projects.json.gz`, gzip do JSON original. O aplicativo descompacta e valida o schema ao iniciar. Não editar os títulos sem registrar fonte e revisão. Para atualizar a versão, substitua o JSON, regenere o gzip e rode `npm test` e `npm run audit:catalog`.
