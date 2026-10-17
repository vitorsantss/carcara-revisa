import { expect, test } from "@playwright/test";
import { alunoEnviaFolhaExemplo, devolver, professorAprovaPendentes, trocarPapel } from "./helpers";

test.describe("Histórico de versões", () => {
  test("reenvio para a mesma proposta incrementa a versão", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await expect(page.getByTestId("redacao-page")).toHaveAttribute("data-versao", "5");
  });
});

test.describe("Radar de competências na devolutiva", () => {
  test("radar compara a versão atual com a anterior", async ({ page }) => {
    await page.goto("/#/redacoes/r-helena-v3?visao=aluno");
    await expect(page.getByTestId("radar-competencias")).toBeVisible();
    await expect(page.getByTestId("radar-serie-atual")).toHaveAttribute("data-valores", "160,160,120,120,120");
    await expect(page.getByTestId("radar-serie-anterior")).toHaveAttribute("data-valores", "120,160,120,120,120");
    await expect(page.getByTestId("radar-nota-total")).toHaveText("680");
    await expect(page.getByTestId("radar-delta")).toHaveAttribute("data-diferenca", "40");
    await expect(page.getByTestId("radar-avanco")).toHaveAttribute("data-competencia", "c1");
    await expect(page.getByTestId("radar-avanco")).toContainText("+40");
    await expect(page.getByTestId("radar-foco")).toHaveAttribute("data-competencia", "c3");
    await expect(page.getByTestId("radar-competencias").getByRole("img").first()).toHaveAttribute("aria-label", /C1 160/);
  });

  test("primeira versão mostra só a série atual e o foco", async ({ page }) => {
    await page.goto("/#/redacoes/r-helena-v1?visao=aluno");
    await expect(page.getByTestId("radar-serie-atual")).toBeVisible();
    await expect(page.getByTestId("radar-serie-anterior")).toHaveCount(0);
    await expect(page.getByTestId("radar-delta")).toHaveCount(0);
    await expect(page.getByTestId("radar-avanco")).toHaveCount(0);
    await expect(page.getByTestId("radar-foco")).toHaveAttribute("data-competencia", "c4");
  });

  test("Baixar PDF imprime só o resumo", async ({ page }) => {
    await page.addInitScript(() => {
      window.print = () => {
        document.body.dataset.impressoes = String(Number(document.body.dataset.impressoes ?? 0) + 1);
      };
    });
    await page.goto("/#/redacoes/r-helena-v3?visao=aluno");
    await page.getByTestId("radar-exportar-pdf").click();
    await expect(page.locator("body")).toHaveAttribute("data-impressoes", "1");
    await page.emulateMedia({ media: "print" });
    await expect(page.getByTestId("radar-resumo-impressao")).toBeVisible();
    await expect(page.getByTestId("devolutiva-folha")).toBeHidden();
    await expect(page.getByTestId("radar-competencias")).toBeHidden();

    await page.emulateMedia({ media: "screen" });
    await page.getByTestId("devolutiva-exportar").click();
    await page.emulateMedia({ media: "print" });
    await expect(page.getByTestId("devolutiva-folha")).toBeVisible();
    await expect(page.getByTestId("radar-resumo-impressao")).toBeHidden();
  });

  test("nova versão devolvida compara com a anterior", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await trocarPapel(page, "professor");
    await professorAprovaPendentes(page);
    await devolver(page);
    await trocarPapel(page, "aluno");
    await expect(page.getByTestId("radar-competencias")).toHaveAttribute("data-versao", "5");
    await expect(page.getByTestId("radar-serie-anterior")).toHaveAttribute("data-valores", "160,160,120,160,160");
    await expect(page.getByTestId("radar-delta")).toHaveAttribute("data-diferenca", "40");
  });

  test("prévia do professor mostra o radar sem exportar nem compartilhar", async ({ page }) => {
    await page.goto("/#/redacoes/r-ana?visao=professor");
    await page.getByTestId("revisao-previa").click();
    await expect(page.getByTestId("radar-competencias")).toBeVisible();
    await expect(page.getByTestId("radar-serie-anterior")).toBeVisible();
    await expect(page.getByTestId("radar-exportar-pdf")).toHaveCount(0);
    await expect(page.getByTestId("devolutiva-compartilhar")).toHaveCount(0);
  });
});
