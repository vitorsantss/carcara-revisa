import { expect, type Page } from "@playwright/test";

/** Aluno importa a folha de exemplo, confere as 3 palavras duvidosas e envia. Retorna o id da redação. */
export async function alunoEnviaFolhaExemplo(page: Page): Promise<string> {
  await page.goto("/#/aluno/enviar");
  await page.getByTestId("envio-usar-exemplo").click();
  await expect(page.getByTestId("transcricao")).toBeVisible();
  await expect(page.getByTestId("envio-enviar")).toBeDisabled();

  for (const i of [0, 1, 2]) {
    await page.getByTestId(`transcricao-duvida-${i}`).click();
    await page.getByTestId("duvida-sugestao-0").click();
    await expect(page.getByTestId(`transcricao-duvida-${i}`)).toHaveAttribute("data-conferida", "true");
  }

  await page.getByTestId("envio-enviar").click();
  await expect(page.getByTestId("redacao-page")).toHaveAttribute("data-visao", "aluno");
  const url = new URL(page.url());
  return url.hash.split("/")[2].split("?")[0];
}

/** Professor aprova todas as correções automáticas pendentes. */
export async function professorAprovaPendentes(page: Page) {
  const aprovar = page.getByTestId("card-aprovar");
  await page.getByTestId("revisao-filtro-pendentes").click();
  while ((await page.getByTestId("revisao-cards-vazio").count()) === 0) {
    await aprovar.first().click();
  }
}

/** Seleciona um trecho do parágrafo da folha (índice do parágrafo, de-até em caracteres do texto puro). */
export async function selecionarTrecho(page: Page, folhaTestId: string, paragrafo: number, de: number, ate: number) {
  await page.getByTestId(`${folhaTestId}-paragrafo-${paragrafo}`).evaluate(
    (p, [a, b]) => {
      const textos: Text[] = [];
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => ((n.parentElement?.closest("sup")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      while (walker.nextNode()) textos.push(walker.currentNode as Text);
      let acum = 0;
      const range = document.createRange();
      let iniciou = false;
      for (const t of textos) {
        const len = t.data.length;
        if (!iniciou && a < acum + len) { range.setStart(t, a - acum); iniciou = true; }
        if (iniciou && b <= acum + len) { range.setEnd(t, b - acum); break; }
        acum += len;
      }
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      p.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    },
    [de, ate],
  );
}
