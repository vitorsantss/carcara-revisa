import { LinhaEvolucao } from "@/components/charts/linha-evolucao";
import { RadarCompetencias } from "@/components/charts/radar-competencias";
import { LegendaSeries } from "@/components/charts/legenda-series";
import { comentarioVisivel, comentariosPrincipais, notaTotal, notasPorCompetencia } from "@/domain/regras";
import type { Redacao } from "@/domain/types";
import { comSinal } from "@/lib/utils";

interface RelatorioDaVersaoProps {
  titulo: string;
  subtitulo: string;
  redacao: Redacao;
  anterior?: Redacao;
  historico: Redacao[];
  aviso?: string;
  "data-testid": string;
}

/**
 * Uma página para imprimir: radar da versão contra a anterior, nota, evolução e
 * os 3 comentários principais. Só aparece na impressão em modo "resumo".
 */
export function RelatorioDaVersao({ titulo, subtitulo, redacao, anterior, historico, aviso, ...props }: RelatorioDaVersaoProps) {
  const total = notaTotal(redacao);
  const comentarios = comentariosPrincipais(redacao.marcacoes);
  return (
    <section data-print="resumo" className="mx-auto max-w-2xl text-sm" {...props}>
      <h2 className="text-lg font-extrabold">{titulo}</h2>
      <p className="mb-4 text-muted-foreground">{subtitulo}</p>
      <div className="grid grid-cols-2 items-center gap-4">
        <div>
          <RadarCompetencias
            tamanho={220}
            animar={false}
            series={[
              ...(anterior ? [{ valores: notasPorCompetencia(anterior), variante: "referencia" as const, nome: `Versão ${anterior.versao}` }] : []),
              { valores: notasPorCompetencia(redacao), variante: "principal" as const, nome: `Versão ${redacao.versao}` },
            ]}
          />
          <LegendaSeries
            className="justify-center"
            itens={[
              { variante: "principal", rotulo: `Versão ${redacao.versao}` },
              ...(anterior ? [{ variante: "referencia" as const, rotulo: `Versão ${anterior.versao}` }] : []),
            ]}
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nota</p>
          <span className="text-3xl font-extrabold tabular-nums">{total}</span>
          {anterior && <span className="ml-1.5 font-bold">{comSinal(total - notaTotal(anterior))}</span>}
          <LinhaEvolucao className="mt-3" totais={historico.map(notaTotal)} largura={220} altura={80} animar={false} />
        </div>
      </div>
      {comentarios.length > 0 && (
        <>
          <p className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Principais comentários</p>
          <ol className="grid list-decimal gap-1 pl-5">
            {comentarios.map((m) => (
              <li key={m.id}>
                <b className="mr-1 font-mono">C{m.competencia}</b>
                {comentarioVisivel(m)}
              </li>
            ))}
          </ol>
        </>
      )}
      {aviso && <p className="mt-4 text-xs text-muted-foreground">{aviso}</p>}
    </section>
  );
}
