import { expect, test } from "@playwright/test";
import { alunoEnviaFolhaExemplo, professorAprovaPendentes, selecionarTrecho } from "./helpers";

test.describe("Fluxo completo: aluno envia, professor revisa, aluno recebe", () => {
  test("mesma redação vista pelo aluno e pelo professor em cada etapa", async ({ page }) => {
    await test.step("aluno envia a folha e confere a transcrição", async () => {
      await alunoEnviaFolhaExemplo(page);
      await expect(page.getByTestId("aluno-aguardando")).toBeVisible();
      await expect(page.getByTestId("aluno-status")).toHaveText("Aguardando professor");
      await expect(page.getByTestId("etapa-enviada")).toHaveAttribute("data-state", "atual");
      await expect(page.getByTestId("aluno-duvidas")).toContainText("3 palavras");
    });

    await test.step("troca para a visão do professor na mesma redação", async () => {
      await page.getByTestId("visao-professor").click();
      await expect(page.getByTestId("revisao")).toBeVisible();
      await expect(page.getByTestId("etapa-em_revisao")).toHaveAttribute("data-state", "atual");
      await expect(page.getByTestId("revisao-devolver")).toBeDisabled();
    });

    await test.step("o aluno ainda não vê marcações enquanto o professor revisa", async () => {
      await page.getByTestId("visao-aluno").click();
      await expect(page.getByTestId("aluno-status")).toHaveText("Em revisão");
      await expect(page.locator('[data-testid^="marca-"]')).toHaveCount(0);
      await page.getByTestId("visao-professor").click();
    });

    await test.step("professor recusa uma correção automática", async () => {
      await page.getByTestId("revisao-filtro-pendentes").click();
      const primeiro = page.locator('[data-testid^="card-"][data-status="pendente"]').first();
      await primeiro.getByTestId("card-recusar").click();
      await primeiro.getByTestId("card-recusa-motivo").selectOption("Não procede");
      await primeiro.getByTestId("card-recusa-confirmar").click();
    });

    await test.step("professor cria uma correção própria selecionando um trecho", async () => {
      await selecionarTrecho(page, "revisao-folha", 2, 21, 43);
      await expect(page.getByTestId("popover-nova-marcacao")).toBeVisible();
      await page.getByTestId("nova-marcacao-competencia").selectOption("3");
      await page.getByTestId("nova-marcacao-erro").click();
      await page.getByTestId("card-editor-texto").fill("Explique por que a escola trata a internet como distração.");
      await page.getByTestId("card-editor-salvar").click();
      await expect(page.locator('[data-origem="professor"]').first()).toBeVisible();
    });

    await test.step("professor aprova o restante, ajusta uma nota e devolve", async () => {
      await professorAprovaPendentes(page);
      await page.getByTestId("nota-c3").selectOption("120");
      await expect(page.getByTestId("nota-total")).toHaveText("760");
      await page.getByTestId("revisao-devolver").click();
    });

    await test.step("aluno vê a devolutiva com a nota do professor e os comentários", async () => {
      await expect(page.getByTestId("redacao-page")).toHaveAttribute("data-visao", "aluno");
      await expect(page.getByTestId("devolutiva")).toBeVisible();
      await expect(page.getByTestId("devolutiva-nota-total")).toContainText("760");
      await expect(page.getByTestId("etapa-devolvida")).toHaveAttribute("data-state", "atual");
      await expect(page.locator('[data-testid^="comentario-"][data-tipo]').filter({ hasText: "Professor" })).toHaveCount(1);
      await expect(page.locator('[data-testid^="marca-"][data-status="recusada"]')).toHaveCount(0);
    });
  });
});
