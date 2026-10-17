---
name: teste-e2e
description: Use ao escrever, corrigir ou gravar testes Playwright do Carcará Revisa, inclusive vídeos de demonstração dos fluxos.
---

# Testes e2e

## Comandos

```bash
npm run test:e2e         # desktop (chromium) + mobile (Pixel 7)
npm run test:e2e:ui      # modo interativo
npm run test:e2e:demo    # grava vídeo com slowMo, para apresentação
BASE_URL=https://... npm run test:e2e   # contra um deploy
```

## Regras

1. **Seletor só por `data-testid`** (`page.getByTestId`). O `testIdAttribute` já está configurado. Nada de seletor por classe CSS ou texto de copy.
2. **Asserção por atributo de estado**: `data-status`, `data-tipo`, `data-origem`, `data-etapa`, `data-visao`, `data-active`, `aria-pressed`. Se o estado que você quer verificar não está exposto, exponha no componente; não teste classe CSS.
3. Itens de lista: `getByTestId(\`card-${id}\`)` ou `locator('[data-testid^="marca-"][data-tipo="erro"]')`.
4. Reaproveite `e2e/helpers.ts`:
   - `alunoEnviaFolhaExemplo(page)`: envia a folha de exemplo resolvendo as dúvidas.
   - `professorAprovaPendentes(page)`: aprova todos os cards pendentes.
   - `selecionarTrecho(page, folhaTestId, paragrafo, de, ate)`: seleciona texto na folha por offset de caractere no parágrafo.
5. O estado é em memória: cada teste começa com `page.goto(...)` limpo. Não dependa da ordem dos testes.
6. Mobile: a sidebar fica fechada. Use `isMobile` e clique em `sidebar-abrir` antes de navegar pelo menu.
7. Filtro padrão da revisão é "Pendentes"; para ver pré-aprovados, clique em `revisao-filtro-todas`.
8. Nome do teste descreve o comportamento da spec, em português. Cite o teste na spec correspondente.

## Estrutura

```ts
import { expect, test } from "@playwright/test";
import { alunoEnviaFolhaExemplo, professorAprovaPendentes } from "./helpers";

test.describe("Devolutiva", () => {
  test.beforeEach(async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await page.getByTestId("visao-professor").click();
    await professorAprovaPendentes(page);
    await page.getByTestId("revisao-devolver").click();
  });

  test("filtro por cor esconde marcações e comentários", async ({ page }) => {
    await page.getByTestId("devolutiva-filtro-erro").click();
    await expect(page.getByTestId("devolutiva-filtro-erro")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator('[data-testid^="marca-"][data-tipo="erro"]')).toHaveCount(0);
  });
});
```

## Ao terminar

Rode a suíte inteira nos dois projetos. Se mudou `data-testid`, atualize `docs/DATA-TESTID.md`.
