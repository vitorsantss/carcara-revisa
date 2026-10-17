import { expect, test } from "@playwright/test";
import { trocarPapel } from "./helpers";

test.describe("Importação e conferência da transcrição", () => {
  test("três formas de importar estão disponíveis", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await expect(page.getByTestId("envio-importar-camera")).toBeVisible();
    await expect(page.getByTestId("envio-importar-galeria")).toBeVisible();
    await expect(page.getByTestId("envio-importar-colar")).toBeVisible();
  });

  test("palavra duvidosa pode ser corrigida, mantida ou digitada", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-usar-exemplo").click();
    await expect(page.getByTestId("transcricao-resumo")).toContainText("3 palavras");

    await page.getByTestId("transcricao-duvida-0").click();
    await page.getByTestId("duvida-sugestao-0").click();
    await expect(page.getByTestId("transcricao-duvida-0")).toHaveText("multidão");

    await page.getByTestId("transcricao-duvida-1").click();
    await page.getByTestId("duvida-manter").click();
    await expect(page.getByTestId("transcricao-duvida-1")).toHaveText("encaminhamenlo");

    await page.getByTestId("transcricao-duvida-2").click();
    await page.getByTestId("duvida-input").fill("leem");
    await page.getByTestId("duvida-ok").click();
    await expect(page.getByTestId("transcricao-duvida-2")).toHaveText("leem");

    await expect(page.getByTestId("envio-enviar")).toBeEnabled();
  });

  test("erro de escrita do aluno não é tratado como dúvida de leitura", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-usar-exemplo").click();
    await expect(page.getByTestId("transcricao")).toContainText("compartilhar-las");
    await expect(page.locator('[data-testid^="transcricao-duvida-"]')).toHaveCount(3);
  });

  test("texto colado vai direto para conferência e envio", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-importar-colar").click();
    const texto = [
      "A desinformação ameaça a democracia brasileira e precisa ser enfrentada com urgência por toda a sociedade.",
      "Em primeiro lugar, a gente compartilha notícias sem conferir a fonte, o que espalha boatos rapidamente.",
      "Além disso, as plataformas lucram com o engajamento. Além disso, poucas regras punem quem espalha mentiras.",
      "Portanto, o Ministério da Educação deve criar oficinas por meio de aulas semanais a fim de formar leitores críticos.",
    ].join("\n");
    await page.getByTestId("envio-colar-textarea").fill(texto);
    await page.getByTestId("envio-colar-continuar").click();
    await expect(page.getByTestId("transcricao-resumo")).toHaveText("Confira o texto antes de enviar.");
    await page.getByTestId("envio-enviar").click();
    await expect(page.getByTestId("aluno-aguardando")).toBeVisible();
    await trocarPapel(page, "professor");
    await expect(page.locator('[data-testid^="marca-"]').first()).toBeVisible();
  });

  test("conferência abre junto da palavra e fecha com Esc ou tocando fora", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-usar-exemplo").click();
    const palavra = page.getByTestId("transcricao-duvida-1");
    await palavra.click();
    const editor = page.getByTestId("duvida-editor");
    await expect(editor).toBeInViewport();
    await expect(editor).toHaveAttribute("data-lado", /acima|abaixo/);
    const caixa = (await editor.boundingBox())!;
    const alvo = (await palavra.boundingBox())!;
    const distancia = (await editor.getAttribute("data-lado")) === "acima"
      ? alvo.y - (caixa.y + caixa.height)
      : caixa.y - (alvo.y + alvo.height);
    expect(distancia).toBeLessThan(24);

    await page.keyboard.press("Escape");
    await expect(editor).toHaveCount(0);

    await palavra.click();
    await page.getByTestId("transcricao-resumo").click();
    await expect(editor).toHaveCount(0);
    await expect(palavra).toHaveAttribute("data-conferida", "false");
  });
});
