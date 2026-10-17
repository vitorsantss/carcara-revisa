import { expect, test, type Page } from "@playwright/test";
import { alunoEnviaFolhaExemplo } from "./helpers";

async function abrirMenu(page: Page, testId: string) {
  const abrir = page.getByTestId("sidebar-abrir");
  if (await abrir.isVisible()) await abrir.click();
  await page.getByTestId(testId).click();
}

test.describe("Overview do aluno", () => {
  test("aluno abre o próprio overview pelo menu", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await abrirMenu(page, "nav-aluno-desempenho");
    const overview = page.getByTestId("overview-aluno");
    await expect(overview).toHaveAttribute("data-aluno", "a-helena");
    await expect(overview).toHaveAttribute("data-visao", "aluno");
    await expect(page.getByTestId("overview-ultima-nota")).toHaveText("760");
    await expect(page.getByTestId("overview-evolucao-total")).toHaveAttribute("data-diferenca", "200");
    await expect(page.getByTestId("overview-melhor-nota")).toHaveText("760");
    await expect(page.getByTestId("overview-devolvidas")).toHaveText("4");
    await expect(page.getByTestId("overview-em-andamento")).toHaveText("0");
  });

  test("overview resume competências e evolução", async ({ page }) => {
    await page.goto("/#/aluno/desempenho");
    await expect(page.getByTestId("overview-serie-ultima")).toHaveAttribute("data-valores", "160,160,120,160,160");
    await expect(page.getByTestId("overview-serie-primeira")).toHaveAttribute("data-valores", "120,120,120,80,120");
    await expect(page.getByTestId("overview-evolucao")).toHaveAttribute("data-totais", "560,640,680,760");
    await expect(page.getByTestId("overview-mais-forte")).toHaveAttribute("data-competencia", "c1");
    await expect(page.getByTestId("overview-avanco")).toHaveAttribute("data-competencia", "c4");
    await expect(page.getByTestId("overview-avanco")).toContainText("+80");
    await expect(page.getByTestId("overview-foco")).toHaveAttribute("data-competencia", "c3");
    await expect(page.getByTestId("overview-competencia-c4")).toHaveAttribute("data-nota", "160");
    await expect(page.getByTestId("overview-competencia-c4")).toHaveAttribute("data-diferenca", "80");
    await expect(page.getByTestId("overview-aluno")).not.toContainText("“");
  });

  test("tabela de versões abre a redação", async ({ page }) => {
    await page.goto("/#/aluno/desempenho");
    await expect(page.getByTestId("overview-versoes").locator("tbody tr")).toHaveCount(4);
    await expect(page.getByTestId("overview-versao-r-helena-v3")).toHaveAttribute("data-total", "680");
    await page.getByTestId("overview-versao-abrir-r-helena-v3").click();
    await expect(page.getByTestId("redacao-page")).toHaveAttribute("data-visao", "aluno");
    await expect(page.getByTestId("radar-competencias")).toHaveAttribute("data-versao", "3");
  });

  test("redação em revisão não muda a nota do overview", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await abrirMenu(page, "nav-aluno-desempenho");
    await expect(page.getByTestId("overview-em-andamento")).toHaveText("1");
    await expect(page.getByTestId("overview-devolvidas")).toHaveText("4");
    await expect(page.getByTestId("overview-ultima-nota")).toHaveText("760");
  });

  test("professor abre o overview a partir de Desempenho", async ({ page }) => {
    await page.goto("/#/professor/desempenho?visao=aluno&aluno=a-helena");
    const ultimaNota = await page.getByTestId("desempenho-ultima-nota").textContent();
    await page.getByTestId("desempenho-abrir-overview").click();
    await expect(page).toHaveURL(/#\/professor\/alunos\/a-helena$/);
    await expect(page.getByTestId("overview-aluno")).toHaveAttribute("data-visao", "professor");
    await expect(page.getByTestId("overview-ultima-nota")).toHaveText(ultimaNota!);
    await expect(page.getByTestId("overview-versao-abrir-r-helena-v4")).toHaveAttribute("href", "#/redacoes/r-helena-v4?visao=professor");
  });

  test("aluno sem devolvida mostra aviso", async ({ page }) => {
    await page.goto("/#/professor/alunos/a-bruno");
    await expect(page.getByTestId("overview-vazio")).toBeVisible();
    await expect(page.getByTestId("overview-em-andamento")).toHaveText("1");
    await expect(page.getByTestId("overview-versoes")).toHaveCount(0);
  });

  test("aluno desconhecido mostra aviso", async ({ page }) => {
    await page.goto("/#/professor/alunos/a-inexistente");
    await expect(page.getByTestId("overview-nao-encontrado")).toContainText("Aluno não encontrado");
    await expect(page.getByTestId("overview-aluno")).toHaveCount(0);
  });
});
