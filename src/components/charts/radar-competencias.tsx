import { cn } from "@/lib/utils";
import { corDoToken } from "@/lib/cores";
import { COMPETENCIAS, NOME_COMPETENCIA, type NotasCompetencias } from "@/domain/types";
import { FONTE_GRAFICO, SVG_FLUIDO, reduzirMovimento, useECharts } from "./use-echarts";

export interface SerieRadar {
  valores: NotasCompetencias;
  variante: "principal" | "referencia";
  nome?: string;
}

/** Tokens de cor usados pelo gráfico. O padrão segue o tema do app; o story usa os tokens dele. */
export interface CoresRadar {
  principal: string;
  referencia: string;
  grade: string;
  rotulo: string;
  contorno: string;
}

const CORES_APP: CoresRadar = { principal: "serie", referencia: "serie-ref", grade: "border", rotulo: "muted-foreground", contorno: "card" };

interface RadarCompetenciasProps {
  series: SerieRadar[];
  rotulos?: boolean;
  tamanho?: number;
  cores?: CoresRadar;
  animar?: boolean;
  className?: string;
  "data-testid"?: string;
}

const NOME_PADRAO = { principal: "Esta versão", referencia: "Referência" } as const;

const descreverSerie = (s: SerieRadar) =>
  `${s.nome ?? NOME_PADRAO[s.variante]}: ${COMPETENCIAS.map((c, i) => `C${c} ${s.valores[i]}`).join(", ")}`;

/** Radar das 5 competências, de 0 a 200 em passos de 40. No máximo 2 séries: a principal e uma referência. */
export function RadarCompetencias({ series, rotulos = true, tamanho = 260, cores = CORES_APP, animar = true, className, ...props }: RadarCompetenciasProps) {
  const visiveis = [...series.filter((s) => s.variante === "referencia"), ...series.filter((s) => s.variante === "principal")].slice(-2);
  const chave = JSON.stringify([visiveis, rotulos, cores, animar]);

  const ref = useECharts(tamanho, tamanho, chave, (el) => {
    const cor = (token: string) => corDoToken(el, token);
    const grade = cor(cores.grade);
    return {
      animation: animar && !reduzirMovimento(),
      animationDuration: 500,
      textStyle: { fontFamily: FONTE_GRAFICO },
      tooltip: rotulos
        ? {
            trigger: "item",
            confine: true,
            formatter: (p: { name: string; value: number[] }) =>
              [p.name, ...COMPETENCIAS.map((c, i) => `C${c} ${NOME_COMPETENCIA[c]}: <b>${p.value[i]}</b>`)].join("<br/>"),
          }
        : undefined,
      radar: {
        indicator: COMPETENCIAS.map((c) => ({ name: `C${c}`, min: 0, max: 200 })),
        splitNumber: 5,
        shape: "polygon",
        radius: rotulos ? "68%" : "80%",
        center: ["50%", "52%"],
        axisName: { show: rotulos, color: cor(cores.rotulo), fontWeight: 700, fontSize: 12, fontFamily: FONTE_GRAFICO },
        axisLine: { lineStyle: { color: grade } },
        splitLine: { lineStyle: { color: grade } },
        splitArea: { show: false },
      },
      series: [
        {
          type: "radar",
          emphasis: { disabled: true },
          data: visiveis.map((s) => {
            const principal = s.variante === "principal";
            const c = cor(principal ? cores.principal : cores.referencia);
            return {
              name: s.nome ?? NOME_PADRAO[s.variante],
              value: s.valores,
              symbol: principal ? "circle" : "none",
              symbolSize: 9,
              lineStyle: { color: c, width: 2, type: principal ? "solid" : [5, 4] },
              itemStyle: { color: c, borderColor: cor(cores.contorno), borderWidth: 2 },
              areaStyle: principal ? { color: c, opacity: 0.16 } : undefined,
            };
          }),
        },
      ],
    };
  });

  return (
    <div
      role="img"
      aria-label={`Radar das competências. ${visiveis.map(descreverSerie).join(". ")}.`}
      data-series={visiveis.length}
      className={cn("mx-auto w-full", SVG_FLUIDO, className)}
      style={{ maxWidth: tamanho }}
      {...props}
    >
      <div ref={ref} />
    </div>
  );
}
