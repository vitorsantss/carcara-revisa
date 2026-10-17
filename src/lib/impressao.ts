/**
 * Modos de impressão. "folha" imprime a página como está (sem o que tem data-print="hide");
 * "resumo" esconde data-print="tela" e mostra só os blocos data-print="resumo".
 */
export type ModoImpressao = "folha" | "resumo";

export function imprimir(modo: ModoImpressao) {
  const raiz = document.documentElement;
  raiz.dataset.impressao = modo;
  window.addEventListener("afterprint", () => delete raiz.dataset.impressao, { once: true });
  window.print();
}
