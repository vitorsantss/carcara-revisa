import type * as React from "react";
import { FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadarCompetencias } from "@/components/charts/radar-competencias";
import { LegendaSeries } from "@/components/charts/legenda-series";
import { insightsDeEvolucao, notaTotal, notasPorCompetencia } from "@/domain/regras";
import { COMPETENCIAS, NOME_COMPETENCIA, type Redacao } from "@/domain/types";
import { imprimir } from "@/lib/impressao";
import { cn, comSinal } from "@/lib/utils";

interface RadarCardProps {
  redacao: Redacao;
  anterior?: Redacao;
  previa: boolean;
  /** Ações extras do aluno, ao lado de "Baixar PDF". */
  acoes?: React.ReactNode;
}

/** "Suas competências": radar da versão atual contra a anterior, notas e onde avançou ou deve focar. */
export function RadarCard({ redacao, anterior, previa, acoes }: RadarCardProps) {
  const atual = notasPorCompetencia(redacao);
  const notasAnteriores = anterior ? notasPorCompetencia(anterior) : null;
  const total = notaTotal(redacao);
  const diferenca = anterior ? total - notaTotal(anterior) : null;
  const { avanco, ganho, foco } = insightsDeEvolucao(atual, notasAnteriores);

  return (
    <Card className="mb-5 grid gap-5 p-5 md:grid-cols-[260px_minmax(0,1fr)]" data-testid="radar-competencias" data-versao={redacao.versao}>
      <div className="grid content-start gap-2">
        <RadarCompetencias
          series={[
            ...(notasAnteriores ? [{ valores: notasAnteriores, variante: "referencia" as const, nome: `Versão ${anterior!.versao}` }] : []),
            { valores: atual, variante: "principal" as const, nome: "Esta versão" },
          ]}
        />
        <LegendaSeries
          className="justify-center"
          itens={[
            { variante: "principal", rotulo: "Esta versão", valores: atual, testId: "radar-serie-atual" },
            ...(notasAnteriores ? [{ variante: "referencia" as const, rotulo: `Versão anterior (v${anterior!.versao})`, valores: notasAnteriores, testId: "radar-serie-anterior" }] : []),
          ]}
        />
      </div>

      <div className="grid content-start gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Suas competências</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold leading-none tracking-tight tabular-nums" data-testid="radar-nota-total">{total}</span>
              {diferenca !== null && (
                <span
                  className={cn("text-sm font-bold", diferenca > 0 ? "text-acerto" : diferenca < 0 ? "text-erro" : "text-muted-foreground")}
                  data-testid="radar-delta"
                  data-diferenca={diferenca}
                  title={`Diferença para a versão ${anterior!.versao}`}
                >
                  {comSinal(diferenca)} <span className="font-medium text-muted-foreground">desde a v{anterior!.versao}</span>
                </span>
              )}
            </div>
          </div>
          {!previa && (
            <div className="flex flex-wrap gap-2" data-print="hide">
              <Button variant="outline" size="sm" onClick={() => imprimir("resumo")} data-testid="radar-exportar-pdf">
                <FileDown /> Baixar PDF
              </Button>
              {acoes}
            </div>
          )}
        </div>

        <ul className="grid grid-cols-5 gap-1.5" aria-label="Notas por competência">
          {COMPETENCIAS.map((c, i) => (
            <li key={c} className="rounded-lg bg-muted px-1 py-2 text-center" title={NOME_COMPETENCIA[c]} data-testid={`radar-nota-c${c}`}>
              <small className="block text-[11px] font-semibold text-muted-foreground">C{c}</small>
              <b className="tabular-nums">{atual[i]}</b>
            </li>
          ))}
        </ul>

        <div className="grid gap-2 text-sm">
          {avanco && (
            <p className="flex flex-wrap items-baseline gap-2" data-testid="radar-avanco" data-competencia={`c${avanco}`}>
              <Badge variant="acerto" className="text-foreground">Avançou</Badge>
              <span><b>C{avanco}</b> {NOME_COMPETENCIA[avanco].toLowerCase()} ({comSinal(ganho)})</span>
            </p>
          )}
          <p className="flex flex-wrap items-baseline gap-2" data-testid="radar-foco" data-competencia={`c${foco}`}>
            <Badge variant="atencao">Foco agora</Badge>
            <span><b>C{foco}</b> {NOME_COMPETENCIA[foco].toLowerCase()}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
