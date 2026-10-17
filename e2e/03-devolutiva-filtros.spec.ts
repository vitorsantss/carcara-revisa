import { expect, test } from "@playwright/test";
import { alunoEnviaFolhaExemplo, devolver, professorAprovaPendentes, trocarPapel } from "./helpers";

test.describe("Devolutiva do aluno", () => {
  test.beforeEach(async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await trocarPapel(page, "professor");
    await professorAprovaPendentes(page);
    await devolver(page);
    await trocarPapel(page, "aluno");
    await expect(page.getByTestId("devolutiva")).toBeVisible();
  });

  test("filtro por cor esconde marcações e comentários", async ({ page }) => {
    const acertos = page.locator('[data-testid^="marca-"][data-tipo="acerto"]');
    await expect(acertos.first()).toBeVisible();

    await page.getByTestId("devolutiva-filtro-acerto").click();
    await expect(page.getByTestId("devolutiva-filtro-acerto")).toHaveAttribute("aria-pressed", "false");
    await expect(acertos).toHaveCount(0);
    await expect(page.locator('[data-testid^="comentario-"][data-tipo="acerto"]')).toHaveCount(0);

    await page.getByTestId("devolutiva-filtro-atencao").click();
    await expect(page.locator('[data-testid^="comentario-"][data-tipo]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="comentario-"][data-tipo="erro"]')).toHaveCount(1);
  });

  test("clicar no trecho destaca o comentário da margem", async ({ page }) => {
    const marca = page.locator('[data-testid^="marca-"][data-tipo="erro"]').first();
    await marca.click();
    await expect(marca).toHaveAttribute("data-active", "true");
    const id = (await marca.getAttribute("data-testid"))!.replace("marca-", "");
    await expect(page.getByTestId(`comentario-${id}`)).toHaveAttribute("data-active", "true");
  });

  test("missões de reescrita aparecem", async ({ page }) => {
    await expect(page.getByTestId("devolutiva-missoes").locator("li")).toHaveCount(3);
  });
});
