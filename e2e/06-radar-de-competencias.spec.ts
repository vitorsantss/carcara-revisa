import { expect, test } from "@playwright/test";
import { alunoEnviaFolhaExemplo } from "./helpers";

test.describe("Histórico de versões", () => {
  test("reenvio para a mesma proposta incrementa a versão", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await expect(page.getByTestId("redacao-page")).toHaveAttribute("data-versao", "5");
  });
});
