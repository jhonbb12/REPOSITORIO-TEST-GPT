# Fluxo de avaliação e ranking via Apps Script HTML Service

## Por que esta tela existe

O GitHub Pages é hospedagem estática. O ContentService do Apps Script não oferece uma API CORS convencional; portanto, não se deve fazer POST direto do navegador do Pages nem usar no-cors para simular confirmação.

Foi implementado o fallback previsto no prompt: o catálogo e a navegação principal permanecem no GitHub Pages, enquanto avaliação e ranking dinâmicos são servidos pelo HTML Service do Apps Script. A página usa google.script.run para chamar funções no servidor. O código de participação não é colocado na URL.

## Pré-requisitos na planilha privada

1. A propriedade de script SPREADSHEET_ID deve apontar para a planilha privada correta.
2. Execute setupSheets() no editor Apps Script. O estado inicial da votação é CLOSED.
3. Importe o CSV oficial de 46 projetos para a aba Projetos. O arquivo gerado pelo projeto é exports/universo_if_catalogo_46_projetos_v1.0.csv; mantenha a ordem do cabeçalho documentada em CONFIGURAR_GOOGLE.md.
4. Confirme que Projetos tem 46 linhas de dados: 24 NAC e 22 EXT.
5. Registre somente tokens sintéticos de homologação com registerCode(token). Não use tokens reais de produção durante o teste.

## Publicação do Web App — requer autorização separada

1. No editor Apps Script, selecione Implantar → Nova implantação → Aplicativo da web.
2. Use Executar como: eu (proprietário que implantou).
3. Acesso anônimo: selecione Qualquer pessoa somente se a conta e a política institucional permitirem e após autorização expressa.
4. Se a opção não estiver disponível, não contorne a política. Registre BLOQUEADO_ACESSO_PUBLICO.
5. Copie a URL terminada em /exec.
6. Na configuração do repositório GitHub, adicione VITE_APPS_SCRIPT_URL como variável de Actions (não como segredo; é URL pública do Web App). Ela deve conter apenas a URL base /exec, sem parâmetros.
7. Não publique a planilha. As abas Codigos e Avaliacoes continuam privadas.

A publicação do Web App e a configuração da variável não foram executadas automaticamente nesta etapa.

## Como a interface funciona

- A URL /exec abre a interface responsiva de avaliação.
- A URL /exec?projectId=NAC-001 abre a mesma tela com o projeto pré-selecionado. Somente o ID público do projeto é passado na URL.
- A aba Avaliar carrega os projetos da planilha, valida as quatro notas no servidor e aguarda um recibo antes de confirmar.
- A aba Ranking consulta agregados por modalidade, com médias por critério, quantidade e amostra mínima de cinco.
- O servidor serializa voto e checagem de duplicidade com LockService.getScriptLock().
- Em caso de falha de rede, a tela mantém o mesmo requestId enquanto o usuário não altera código, projeto ou notas, permitindo retentativa idempotente.
- O HTML Service mantém o isolamento padrão de frame; não habilite XFrameOptionsMode.ALLOWALL.

## Homologação obrigatória antes de abrir a votação

Em uma planilha privada de homologação, com votação aberta apenas para os tokens sintéticos autorizados:

1. Envie notas [4,5,4,3]; confirme média ponderada 4,15.
2. Confira o recibo exibido pela interface e a linha correspondente na aba Avaliacoes.
3. Reenvie o mesmo código para o mesmo projeto: deve ser recusado como VOTO_DUPLICADO.
4. Use o mesmo código em outro projeto: deve ser aceito.
5. Reenvie o mesmo requestId com payload idêntico: deve retornar o mesmo recibo, sem nova linha.
6. Teste duas requisições simultâneas do mesmo par código/projeto: exatamente uma gravação deve ser válida.
7. Confirme o ranking separado por modalidade e o estado Aguardando amostra mínima abaixo de cinco votos.
8. Confirme que nenhuma resposta pública contém token, hash ou linha individual de avaliação.

Depois do teste, execute setVotingStatus("CLOSED") e preserve a planilha de homologação privada. A abertura pública da votação exige nova autorização explícita.

## Limitação atual

O código do HTML Service está versionado, mas ainda não foi executado no runtime real do Google Apps Script nesta etapa. Até realizar o deploy autorizado, testar com navegador anônimo/celular e conferir o readback na planilha, o gate G4 permanece BLOCKED_CONNECTED_VOTE e a aplicação não está homologada.
