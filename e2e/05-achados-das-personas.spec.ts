import { expect, test, type Page } from "@playwright/test";
import { alunoEnviaFolhaExemplo, devolver, professorAprovaPendentes, selecionarTrecho, trocarPapel } from "./helpers";

/** Imagem uniforme, como a foto do verso de uma folha sem nada escrito. */
async function folhaEmBranco(page: Page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgb(245, 243, 236)";
    ctx.fillRect(0, 0, 300, 400);
    return canvas.toDataURL("image/png");
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

const TEXTO_BASE = [
  "A desinformação nas redes sociais é um desafio para a democracia brasileira e precisa ser enfrentada com urgência por toda a sociedade.",
  "Em primeiro lugar, muitos usuários compartilham notícias sem conferir a fonte, o que espalha boatos rapidamente entre familiares e amigos.",
  "Além disso, as plataformas lucram com o engajamento e têm pouco interesse em remover conteúdos falsos, mesmo depois de desmentidos pelas agências de checagem.",
  "Portanto, o Ministério da Educação deve criar oficinas de checagem por meio de aulas semanais com notícias reais, a fim de formar leitores críticos.",
];

async function colarEConferir(page: Page, texto: string) {
  await page.goto("/#/aluno/enviar");
  await page.getByTestId("envio-importar-colar").click();
  await page.getByTestId("envio-colar-textarea").fill(texto);
  await page.getByTestId("envio-colar-continuar").click();
  await expect(page.getByTestId("transcricao")).toBeVisible();
}

async function enviarColado(page: Page, texto: string) {
  await colarEConferir(page, texto);
  await page.getByTestId("envio-enviar").click();
  await expect(page.getByTestId("aluno-aguardando")).toBeVisible();
}

test.describe("Envio: avisos antes de enviar", () => {
  test("assinatura no fim do texto é apontada e pode ser removida", async ({ page }) => {
    await colarEConferir(page, [...TEXTO_BASE, "Gabriel Souza"].join("\n"));
    await expect(page.getByTestId("envio-aviso-identificacao")).toBeVisible();
    await page.getByTestId("envio-remover-identificacao").click();
    await expect(page.getByTestId("envio-aviso-identificacao")).toHaveCount(0);
    await expect(page.getByTestId("transcricao")).not.toContainText("Gabriel Souza");
  });

  test("texto que termina no meio da frase gera aviso de foto cortada", async ({ page }) => {
    await colarEConferir(page, [...TEXTO_BASE.slice(0, 3), "Portanto, o Ministério da Educação deve criar oficinas de checagem por meio de"].join("\n"));
    await expect(page.getByTestId("envio-aviso-texto_incompleto")).toBeVisible();
  });

  test("relato pessoal fora do tema gera avisos e zero sugerido ao professor", async ({ page }) => {
    const relato = [
      "Eu lembro do primeiro dia em que comecei a trabalhar na farmácia, quando eu tinha dezesseis anos e minha mãe ficou preocupada comigo.",
      "Meu irmão me levava de bicicleta todos os dias e eu chegava cansada, mas feliz, porque meu salário ajudava minha família inteira.",
      "Com o tempo eu aprendi muito com os clientes e minha vida mudou bastante, e hoje eu sei que meu esforço valeu a pena.",
      "Por isso eu acredito que trabalhar cedo me ensinou a ter responsabilidade e a cuidar das pessoas que eu amo.",
    ].join("\n");
    await colarEConferir(page, relato);
    await expect(page.getByTestId("envio-aviso-narrativo")).toBeVisible();
    await expect(page.getByTestId("envio-aviso-fuga_ao_tema")).toBeVisible();
    await page.getByTestId("envio-enviar").click();
    await expect(page.getByTestId("aluno-alertas")).toBeVisible();
    await trocarPapel(page, "professor");
    await expect(page.getByTestId("revisao-zero")).toHaveAttribute("data-situacao", "sugerido");
  });

  test("cópia dos textos motivadores é apontada ao aluno e ao professor", async ({ page }) => {
    const copia = [TEXTO_BASE[0], "Notícias falsas se espalham seis vezes mais rápido do que as verdadeiras, porque despertam emoções fortes como medo e indignação.", ...TEXTO_BASE.slice(1)].join("\n");
    await colarEConferir(page, copia);
    await expect(page.getByTestId("envio-aviso-copia_motivadores")).toBeVisible();
    await page.getByTestId("envio-enviar").click();
    await expect(page.getByTestId("aluno-aguardando")).toBeVisible();
    await trocarPapel(page, "professor");
    await expect(page.getByTestId("revisao-alerta-copia_motivadores")).toBeVisible();
    await page.getByTestId("revisao-filtro-todas").click();
    await expect(page.getByTestId("revisao-cards")).toContainText("copiada dos textos motivadores");
  });

  test("mesmo texto enviado de novo é avisado e sinalizado na fila", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-usar-exemplo").click();
    for (const i of [0, 1, 2]) {
      await page.getByTestId(`transcricao-duvida-${i}`).click();
      await page.getByTestId("duvida-sugestao-0").click();
    }
    await expect(page.getByTestId("envio-aviso-texto_repetido")).toBeVisible();
    await page.getByTestId("envio-enviar").click();
    await expect(page.getByTestId("aluno-aguardando")).toBeVisible();
    await trocarPapel(page, "professor");
    await expect(page.getByTestId("revisao-alerta-texto_repetido")).toBeVisible();
  });

  test("aluno corrige qualquer palavra do texto lido, não só as amarelas", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-usar-exemplo").click();
    await page.getByTestId("transcricao-editar").click();
    const editor = page.getByTestId("transcricao-editor-texto");
    await editor.fill((await editor.inputValue()).replace("Umberto Eco", "Umberto Eco, em 2015,"));
    await page.getByTestId("transcricao-editor-concluir").click();
    await expect(page.getByTestId("transcricao")).toContainText("Umberto Eco, em 2015,");
  });

  test("foto em branco pergunta se é o lado certo da folha", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-input-galeria").setInputFiles({ name: "verso.png", mimeType: "image/png", buffer: await folhaEmBranco(page) });
    await expect(page.getByTestId("envio-folha-em-branco")).toBeVisible();
    await page.getByTestId("envio-branco-trocar").click();
    await expect(page.getByTestId("envio-importar-galeria")).toBeVisible();
  });

  test("frente e verso entram como uma redação só", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    const foto = await page.screenshot();
    await page.getByTestId("envio-input-galeria").setInputFiles([
      { name: "frente.png", mimeType: "image/png", buffer: foto },
      { name: "verso.png", mimeType: "image/png", buffer: foto },
    ]);
    await expect(page.getByTestId("envio-folhas")).toHaveAttribute("data-quantidade", "2");
  });

  test("sem internet, o envio avisa e o texto continua na tela", async ({ page, context }) => {
    await colarEConferir(page, TEXTO_BASE.join("\n"));
    await context.setOffline(true);
    await page.getByTestId("envio-enviar").click();
    await expect(page.getByTestId("envio-status")).toContainText("Sem internet");
    await expect(page.getByTestId("transcricao")).toBeVisible();
    await context.setOffline(false);
  });

  test("depois de enviar, o aluno vê os próximos passos e a previsão", async ({ page }) => {
    await enviarColado(page, TEXTO_BASE.join("\n"));
    await expect(page.getByTestId("aluno-proximos-passos")).toBeVisible();
    await expect(page.getByTestId("aluno-previsao")).toContainText("até");
    await page.goto("/#/aluno/redacoes");
    await expect(page.getByTestId("minha-redacao-explicacao").first()).toContainText("Previsão");
  });

  test("política de privacidade e de uso de IA é acessível", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-link-privacidade").click();
    await expect(page.getByTestId("privacidade-ia")).toBeVisible();
    await expect(page.getByTestId("privacidade-quem-ve")).toBeVisible();
  });
});

test.describe("Revisão: zero, notas e devolução", () => {
  test("zero sugerido bloqueia a devolução até o professor decidir", async ({ page }) => {
    await page.goto("/#/redacoes/r-davi?visao=professor");
    await expect(page.getByTestId("revisao-zero")).toHaveAttribute("data-situacao", "sugerido");
    await professorAprovaPendentes(page);
    await expect(page.getByTestId("revisao-devolver")).toBeDisabled();
    await page.getByTestId("revisao-zero-justificativa").fill("Na próxima, escreva pelo menos 20 linhas. Você já tem boas ideias!");
    await page.getByTestId("revisao-zero-confirmar").click();
    await devolver(page);
    await trocarPapel(page, "aluno");
    await expect(page.getByTestId("devolutiva-zero-motivo")).toContainText("7 linhas");
    await expect(page.getByTestId("devolutiva-zero")).toContainText("boas ideias");
    await expect(page.getByTestId("devolutiva-zero-como-evitar")).toBeVisible();
    await expect(page.getByTestId("devolutiva-nota-total")).toContainText("0");
    await expect(page.getByTestId("devolutiva-competencias")).toHaveCount(0);
    await expect(page.getByTestId("devolutiva-missoes")).toHaveCount(0);
    await expect(page.getByTestId("devolutiva-proxima")).toBeVisible();
  });

  test("mensagem do zero escrita depois de confirmar também chega ao aluno", async ({ page }) => {
    await page.goto("/#/redacoes/r-davi?visao=professor");
    await professorAprovaPendentes(page);
    await page.getByTestId("revisao-zero-confirmar").click();
    await page.getByTestId("revisao-zero-justificativa").fill("Você tem boas ideias, desenvolva em 20 linhas.");
    await page.getByTestId("revisao-recado-texto").click();
    await devolver(page);
    await trocarPapel(page, "aluno");
    await expect(page.getByTestId("devolutiva-zero")).toContainText("desenvolva em 20 linhas");
  });

  test("anular o zero devolve as notas ao professor", async ({ page }) => {
    await page.goto("/#/redacoes/r-davi?visao=professor");
    await expect(page.getByTestId("nota-c1")).toBeDisabled();
    await page.getByTestId("revisao-zero-anular").click();
    await expect(page.getByTestId("revisao-zero")).toHaveAttribute("data-situacao", "anulado");
    await expect(page.getByTestId("nota-c1")).toBeEnabled();
  });

  test("nota alterada fica registrada e a justificativa chega ao aluno", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await trocarPapel(page, "professor");
    await professorAprovaPendentes(page);
    await page.getByTestId("nota-c3").selectOption("120");
    await expect(page.getByTestId("revisao-nota-alterada-c3")).toContainText("de 160 para 120");
    await page.getByTestId("revisao-justificativa-c3").fill("O terceiro parágrafo afirma sem exemplo que comprove.");
    await page.getByTestId("revisao-recado-texto").fill("Ótima evolução, continue assim!");
    await page.getByTestId("revisao-justificativa-c3").focus();
    await page.getByTestId("revisao-previa").click();
    await expect(page.getByTestId("devolutiva")).toHaveAttribute("data-previa", "true");
    await expect(page.getByTestId("devolutiva-justificativa-c3")).toContainText("sem exemplo que comprove");
    await expect(page.getByTestId("devolutiva-recado")).toContainText("Ótima evolução");
    await page.getByTestId("revisao-previa-fechar").click();
    await devolver(page);
    await trocarPapel(page, "aluno");
    await expect(page.getByTestId("devolutiva-justificativa-c3")).toContainText("nota definida pelo professor");
    await expect(page.getByTestId("devolutiva-competencia-c1")).toContainText("Norma culta");
    await expect(page.locator('[data-testid^="comentario-"][data-autoria="aprovada"]').first()).toContainText("aprovada pelo professor");
  });

  test("atalhos de teclado aprovam sem tirar a mão do teclado", async ({ page }) => {
    await page.goto("/#/redacoes/r-ana?visao=professor");
    const pendentesAntes = await page.locator('[data-testid^="card-"][data-status="pendente"]').count();
    await page.keyboard.press("j");
    await page.keyboard.press("a");
    await page.getByTestId("revisao-filtro-todas").click();
    await expect(page.locator('[data-testid^="card-"][data-status="pendente"]')).toHaveCount(pendentesAntes - 1);
  });

  test("redações revisadas são devolvidas em lote pela fila", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await trocarPapel(page, "professor");
    await professorAprovaPendentes(page);
    await page.goto("/#/professor/fila");
    await page.getByTestId("fila-devolver-prontas").click();
    await page.getByTestId("fila-lote-confirmar").click();
    await expect(page.getByTestId("fila-devolver-prontas")).toHaveCount(0);
  });

  test("notas podem ser exportadas em CSV", async ({ page }) => {
    await page.goto("/#/professor/fila");
    const download = page.waitForEvent("download");
    await page.getByTestId("fila-exportar").click();
    expect((await download).suggestedFilename()).toBe("notas-carcara-revisa.csv");
  });
});

test.describe("Devolutiva: contestação", () => {
  test("aluno pede revisão de uma nota e o professor reabre", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await trocarPapel(page, "professor");
    await professorAprovaPendentes(page);
    await devolver(page);
    await trocarPapel(page, "aluno");
    await page.getByTestId("devolutiva-pedir-c3").click();
    await page.getByTestId("devolutiva-pedido-texto-c3").fill("Meu terceiro parágrafo tem um exemplo sobre manchetes.");
    await page.getByTestId("devolutiva-pedido-enviar-c3").click();
    await expect(page.getByTestId("devolutiva-pedido-confirmacao-c3")).toContainText("Pedido de revisão enviado");
    const id = new URL(page.url()).hash.split("/")[2].split("?")[0];
    await trocarPapel(page, "professor");
    await page.goto("/#/professor/fila");
    await expect(page.getByTestId(`fila-item-${id}`).getByTestId("fila-item-pedido")).toBeVisible();
    await expect(page.getByTestId(`fila-item-${id}`).getByTestId("fila-item-pendentes")).not.toContainText("zero");
    await page.getByTestId(`fila-item-${id}`).click();
    await expect(page.getByTestId("revisao-pedidos")).toContainText("manchetes");
    await page.getByTestId("revisao-reabrir").click();
    await expect(page.getByTestId("nota-c3")).toBeEnabled();
  });
});

test.describe("Rodada 3: ajustes", () => {
  test("pré-aprovada aparece ao aluno como aceita automaticamente, não como decisão do professor", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await trocarPapel(page, "professor");
    await professorAprovaPendentes(page);
    await devolver(page);
    await trocarPapel(page, "aluno");
    const pre = page.locator('[data-testid^="comentario-"][data-autoria="pre_aprovada"]').first();
    await expect(pre).toContainText("aceita automaticamente");
    await expect(pre).not.toContainText("aprovada pelo professor");
    await expect(page.getByTestId("aluno-glossario")).toHaveCount(0);
  });

  test("assinatura com complemento é apontada sem falso aviso de texto cortado", async ({ page }) => {
    await colarEConferir(page, [...TEXTO_BASE, "Gabriel Martins - Turma Medicina B"].join("\n"));
    await expect(page.getByTestId("envio-aviso-identificacao")).toBeVisible();
    await expect(page.getByTestId("envio-aviso-texto_incompleto")).toHaveCount(0);
  });

  test("aviso de cópia mostra quais frases foram copiadas", async ({ page }) => {
    const frase = "Notícias falsas se espalham seis vezes mais rápido do que as verdadeiras, porque despertam emoções fortes como medo e indignação.";
    await colarEConferir(page, [TEXTO_BASE[0], frase, ...TEXTO_BASE.slice(1)].join("\n"));
    await expect(page.getByTestId("envio-frases-copiadas")).toContainText("seis vezes mais rápido");
  });

  test("redação repetida fica fora do lote e mostra a comparação das notas", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await page.goto("/#/aluno/enviar");
    await page.getByTestId("envio-usar-exemplo").click();
    for (const i of [0, 1, 2]) {
      await page.getByTestId(`transcricao-duvida-${i}`).click();
      await page.getByTestId("duvida-sugestao-0").click();
    }
    await page.getByTestId("envio-enviar").click();
    await expect(page.getByTestId("aluno-aguardando")).toBeVisible();
    await trocarPapel(page, "professor");
    await expect(page.getByTestId("revisao-comparacao-repetida")).toBeVisible();
    await professorAprovaPendentes(page);
    await page.goto("/#/professor/fila");
    await expect(page.getByTestId("fila-devolver-prontas")).toHaveCount(0);
  });

  test("selecionar trecho já marcado explica o que fazer", async ({ page }) => {
    await alunoEnviaFolhaExemplo(page);
    await trocarPapel(page, "professor");
    await selecionarTrecho(page, "revisao-folha", 0, 2, 25);
    await expect(page.getByTestId("popover-conflito")).toBeVisible();
  });

  test("foto original abre ao lado do texto e amplia", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    const foto = await page.screenshot();
    await page.getByTestId("envio-input-galeria").setInputFiles({ name: "folha.png", mimeType: "image/png", buffer: foto });
    for (const i of [0, 1, 2]) {
      await page.getByTestId(`transcricao-duvida-${i}`).click();
      await page.getByTestId("duvida-sugestao-0").click();
    }
    await page.getByTestId("envio-enviar").click();
    await expect(page.getByTestId("aluno-aguardando")).toBeVisible();
    await trocarPapel(page, "professor");
    await page.getByTestId("revisao-ver-foto").click();
    await expect(page.getByTestId("revisao-fotos")).toHaveAttribute("data-ampliada", "false");
    await page.getByTestId("revisao-foto-zoom").click();
    await expect(page.getByTestId("revisao-fotos")).toHaveAttribute("data-ampliada", "true");
    await expect(page.getByTestId("revisao-folha")).toBeVisible();
  });

  test("com fonte 150%, a conferência não rola para o lado e o OK da palavra fica visível", async ({ page }) => {
    await page.goto("/#/aluno/enviar");
    await page.addStyleTag({ content: "html { font-size: 150% !important; }" });
    await page.getByTestId("envio-usar-exemplo").click();
    await page.getByTestId("transcricao-duvida-2").click();
    await expect(page.getByTestId("duvida-ok")).toBeInViewport();
    const transborda = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(transborda).toBe(false);
  });

  test("o aluno encontra a explicação das competências enquanto espera a correção", async ({ page }) => {
    await enviarColado(page, TEXTO_BASE.join("\n"));
    await page.getByTestId("aluno-glossario").click();
    await expect(page.getByTestId("aluno-glossario")).toContainText("Proposta de intervenção");
  });
});
