let contexto: CanvasRenderingContext2D | null = null;

/**
 * Lê um token de cor do tema no elemento e devolve em rgba, formato que bibliotecas
 * de gráfico entendem (oklch e var() não funcionam dentro do ECharts).
 */
export function corDoToken(el: Element, token: string): string {
  const valor = getComputedStyle(el).getPropertyValue(`--${token}`).trim();
  contexto ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!contexto || !valor) return valor;
  contexto.clearRect(0, 0, 1, 1);
  contexto.fillStyle = "transparent";
  contexto.fillStyle = valor;
  contexto.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = contexto.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
}
