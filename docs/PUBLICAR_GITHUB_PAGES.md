# Publicar a versão de demonstração no GitHub Pages

Este procedimento publica somente a interface de demonstração. A votação permanece desabilitada até homologação do Apps Script, CORS, recibo e leitura de retorno na planilha.

## 1. Configurar o Pages

1. Abra o repositório `jhonbb12/REPOSITORIO-TEST-GPT`.
2. Acesse **Settings → Pages**.
3. Em **Build and deployment → Source**, selecione **GitHub Actions**.
4. Salve, se o GitHub apresentar essa opção.

Não selecione implantação por branch/folder: o projeto usa o workflow `.github/workflows/pages.yml`.

## 2. Configurar a URL do Apps Script (quando o Web App estiver implantado)

1. No repositório, abra **Settings → Secrets and variables → Actions → Variables**.
2. Crie a variável de repositório `VITE_APPS_SCRIPT_URL` com a URL `/exec` da implantação do Web App.
3. A URL é configuração pública do endpoint; nunca coloque tokens de votação nela.
4. Se o Web App ainda não foi implantado, deixe a variável ausente. O catálogo e as telas continuam disponíveis, mas o ranking exibirá indisponibilidade.

## 3. Integrar a branch de desenvolvimento

O workflow atual só publica a partir da branch `main`. Antes da implantação, o PR #1 precisa ser revisado e integrado à `main`. Não faça merge enquanto os testes e a revisão não estiverem concluídos.

PR: https://github.com/jhonbb12/REPOSITORIO-TEST-GPT/pull/1

## 4. Executar a publicação manual

Depois que o PR estiver integrado:

1. Abra **Actions** no repositório.
2. Selecione **Build and deploy to GitHub Pages**.
3. Clique em **Run workflow**.
4. Escolha a branch `main`.
5. Marque `publish=true).
6. Confirme **Run workflow**.
7. Aguarde os jobs `build` e `deploy) terminarem com sucesso.

## 5. Endereço esperado

https://jhonbb12.github.io/REPOSITORIO-TEST-GPT/

O endereço só estará ativo depois que o job `deploy` terminar com sucesso. Se o repositório for privado, confirme se o plano e as configurações da organização permitem GitHub Pages.

## 6. Limites desta primeira publicação

- A página é uma demonstração/homologação.
- O botão de envio de voto permanece bloqueado no frontend.
- O ranking depende da URL do Web App e de teste de acesso real.
- Não abra votação, não distribua códigos e não publique dados administrativos.
- A planilha Google deve continuar privada.

A publicação da demonstração não equivale a homologação do sistema de votação.
