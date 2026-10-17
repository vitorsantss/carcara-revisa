import * as React from "react";
import * as echarts from "echarts/core";
import { LineChart, RadarChart } from "echarts/charts";
import { GridComponent, RadarComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";

echarts.use([RadarChart, LineChart, RadarComponent, GridComponent, TooltipComponent, SVGRenderer]);

export type OpcoesGrafico = echarts.EChartsCoreOption;

/** Faz o SVG de tamanho fixo ocupar a largura disponível, mantendo a proporção. */
export const SVG_FLUIDO = "[&_div:has(>svg)]:!h-auto [&_div:has(>svg)]:!w-full [&_svg]:h-auto [&_svg]:w-full";

export const FONTE_GRAFICO = "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif";

/**
 * Monta um gráfico ECharts em SVG com tamanho fixo: funciona em nós escondidos
 * (impressão) e é capturado pelo html-to-image. O SVG escala pelo viewBox.
 * `montar` recebe o contêiner para ler os tokens de cor; `chave` muda quando os dados mudam.
 */
export function useECharts(largura: number, altura: number, chave: string, montar: (el: HTMLElement) => OpcoesGrafico) {
  const ref = React.useRef<HTMLDivElement>(null);
  const montarAtual = React.useRef(montar);
  montarAtual.current = montar;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const grafico = echarts.init(el, null, { renderer: "svg", width: largura, height: altura });
    grafico.setOption(montarAtual.current(el));
    return () => grafico.dispose();
  }, [largura, altura, chave]);

  return ref;
}

export const reduzirMovimento = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
