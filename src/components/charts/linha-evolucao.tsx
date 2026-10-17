import { corDoToken } from "@/lib/cores";
import { FONTE_GRAFICO, reduzirMovimento, useECharts } from "./use-echarts";

export interface CoresLinha {
  linha: string;
  rotulo: string;
  destaque: string;
}

const CORES_APP: CoresLinha = { linha: "serie", rotulo: "foreground", destaque: "foreground" };

interface LinhaEvolucaoProps {
  totais: number[];
  rotulos?: boolean;
  largura?: number;
  altura?: number;
  cores?: CoresLinha;
  animar?: boolean;
  className?: string;
  "data-testid"?: string;
}

/** Total de cada versão, da primeira à última. Rótulo só no primeiro e no último ponto; o último fica destacado. */
export function LinhaEvolucao({ totais, rotulos = true, largura = 260, altura = 90, cores = CORES_APP, animar = true, className, ...props }: LinhaEvolucaoProps) {
  const chave = JSON.stringify([totais, rotulos, cores, animar]);
  const ultimo = totais.length - 1;

  const ref = useECharts(largura, altura, chave, (el) => {
    const cor = (token: string) => corDoToken(el, token);
    const corLinha = cor(cores.linha);
    const escala = Math.max(12, Math.round(altura / 7));
    return {
      animation: animar && !reduzirMovimento(),
      animationDuration: 500,
      textStyle: { fontFamily: FONTE_GRAFICO },
      grid: { left: escala * 1.4, right: escala * 1.4, top: rotulos ? escala * 2 : escala, bottom: escala },
      xAxis: { type: "category", show: false, boundaryGap: totais.length < 2, data: totais.map((_, i) => `v${i + 1}`) },
      yAxis: { type: "value", show: false, min: Math.max(0, Math.min(...totais) - 40), max: 1000 },
      series: [
        {
          type: "line",
          silent: true,
          symbol: "circle",
          lineStyle: { color: corLinha, width: Math.max(2.5, altura / 36) },
          data: totais.map((v, i) => {
            const extremo = i === 0 || i === ultimo;
            return {
              value: v,
              symbolSize: i === ultimo ? escala : escala * 0.6,
              itemStyle: { color: corLinha, borderColor: i === ultimo ? cor(cores.destaque) : corLinha, borderWidth: i === ultimo ? Math.max(2, escala / 6) : 0 },
              label: {
                show: rotulos && extremo,
                position: "top",
                distance: escala * 0.5,
                align: totais.length > 1 ? (i === 0 ? "left" : "right") : "center",
                color: cor(cores.rotulo),
                fontWeight: 700,
                fontSize: Math.max(11, escala * 0.9),
                fontFamily: FONTE_GRAFICO,
              },
            };
          }),
        },
      ],
    };
  });

  const descricao = rotulos ? totais.join(", ") : `${totais.length} versões`;
  return (
    <div
      role="img"
      aria-label={`Evolução da nota: ${descricao}.`}
      data-totais={rotulos ? totais.join(",") : undefined}
      data-rotulos={rotulos}
      className={className}
      style={{ width: largura, height: altura }}
      {...props}
    >
      <div ref={ref} />
    </div>
  );
}
