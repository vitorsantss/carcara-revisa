import { expect, test } from "@playwright/test";
import { TELAS } from "./telas";

test.describe("Fila do professor", () => {
  test("ordena por prioridade com risco de nota zero no topo", async ({ page }) => {
    await page.goto("/#/professor/fila");
    const primeiro = page.locator('[data-testid^="fila-item-r-"]').first();
    await expect(primeiro.getByTestId("fila-item-risco-zero")).toBeVisible();
  });

  test("filtra por turma e por situação", async ({ page }) => {
    await page.goto("/#/professor/fila");
    await page.getByTestId("fila-filtro-turma").selectOption("t-3b");
    await expect(page.locator('[data-testid^="fila-item-r-"]')).toHaveCount(1);
    await page.getByTestId("fila-filtro-devolvidas").click();
    await expect(page.getByTestId("fila-anterior-a-eduardo")).toBeVisible();
  });

  test("abrir uma redação leva à visão do professor", async ({ page }) => {
    await page.goto("/#/professor/fila");
    await page.getByTestId("fila-item-r-ana").click();
    await expect(page.getByTestId("redacao-page")).toHaveAttribute("data-visao", "professor");
    await page.getByTestId("revisao-filtro-todas").click();
    await expect(page.getByTestId("card-pre-aprovada").first()).toBeVisible();
  });
});

test.describe("Sidebar e telas pendentes", () => {
  for (const t of TELAS) {
    test(`menu "${t.nav}" abre a tela pendente`, async ({ page, isMobile }) => {
      await page.goto("/#/professor/fila");
      if (isMobile) await page.getByTestId("sidebar-abrir").click();
      await page.getByTestId(t.nav).click();
      await expect(page.getByTestId(`pendente-${t.slug}`)).toBeVisible();
      await expect(page.getByTestId("pendente-badge")).toHaveText("Pendente de implementação");
    });
  }

  test("trocar o papel muda a tela inicial", async ({ page, isMobile }) => {
    await page.goto("/#/aluno/enviar");
    if (isMobile) await page.getByTestId("sidebar-abrir").click();
    await page.getByTestId("papel-professor").click();
    await expect(page.getByTestId("fila-page")).toBeVisible();
  });

  test("aluno só vê o menu do aluno", async ({ page, isMobile }) => {
    await page.goto("/#/aluno/enviar");
    if (isMobile) await page.getByTestId("sidebar-abrir").click();
    await expect(page.getByTestId("nav-grupo-aluno")).toBeVisible();
    for (const grupo of ["professor", "instituição", "equipe"]) {
      await expect(page.getByTestId(`nav-grupo-${grupo}`)).toHaveCount(0);
    }
  });

  test("professor só vê os menus de professor, instituição e equipe", async ({ page, isMobile }) => {
    await page.goto("/#/professor/fila");
    if (isMobile) await page.getByTestId("sidebar-abrir").click();
    for (const grupo of ["professor", "instituição", "equipe"]) {
      await expect(page.getByTestId(`nav-grupo-${grupo}`)).toBeVisible();
    }
    await expect(page.getByTestId("nav-grupo-aluno")).toHaveCount(0);
  });

  test("trocar o papel dentro de uma redação mantém a redação e troca o menu", async ({ page, isMobile }) => {
    await page.goto("/#/redacoes/r-ana?visao=aluno");
    if (isMobile) await page.getByTestId("sidebar-abrir").click();
    await page.getByTestId("papel-professor").click();
    await expect(page.getByTestId("redacao-page")).toHaveAttribute("data-visao", "professor");
    if (isMobile) await page.getByTestId("sidebar-abrir").click();
    await expect(page.getByTestId("nav-grupo-professor")).toBeVisible();
    await expect(page.getByTestId("nav-grupo-aluno")).toHaveCount(0);
  });

  test("bastidores registram a regra aprendida após uma recusa", async ({ page }) => {
    await page.goto("/#/redacoes/r-ana?visao=professor");
    const card = page.locator('[data-testid^="card-"][data-status="pendente"]').first();
    await card.getByTestId("card-recusar").click();
    await card.getByTestId("card-recusa-confirmar").click();
    await page.goto("/#/bastidores");
    await expect(page.getByTestId("regra-aprendida")).toHaveCount(1);
  });
});
