import type * as React from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, Avatar } from "@/components/ui/misc";
import { LegendaSeries } from "@/components/charts/legenda-series";
import { LinhaEvolucao } from "@/components/charts/linha-evolucao";
import { RadarCompetencias } from "@/components/charts/radar-competencias";
import { useApp } from "@/store/app-store";
import { PROPOSTA, TURMAS } from "@/domain/seed";
import { notaTotal, notasPorCompetencia, overviewDoAluno, type OverviewAluno as Overview } from "@/domain/regras";
import { COMPETENCIAS, NOME_COMPETENCIA, type Aluno, type Competencia, type NotasCompetencias, type Papel } from "@/domain/types";
import { cn, comSinal, dataCurta } from "@/lib/utils";

const ROTULO = "mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const corDaDiferenca = (n: number) => (n > 0 ? "text-acerto" : n < 0 ? "text-erro" : "text-muted-foreground");

/** Desempenho geral do aluno na proposta: indicadores, competências e todas as versões devolvidas. */
export function OverviewAluno({ aluno, visao }: { aluno: Aluno; visao: Papel }) {
  const { estado } = useApp();
  const overview = overviewDoAluno(estado.redacoes, aluno.id, PROPOSTA.id);
  const turma = TURMAS.find((t) => t.id === aluno.turmaId);

  return (
    <div className="mx-auto grid max-w-5xl gap-5" data-testid="overview-aluno" data-aluno={aluno.id} data-visao={visao}>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar nome={aluno.nome} className="size-11 text-sm" />
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight" data-testid="overview-nome">{aluno.nome}</h2>
          <p className="text-sm text-muted-foreground">{turma?.nome} · {PROPOSTA.temaCurto}</p>
        </div>
      </div>

      <Indicadores overview={overview} />

      {overview.ultimas ? (
        <>
          <Competencias overview={overview} ultimas={overview.ultimas} />
          <Versoes overview={overview} visao={visao} />
        </>
      ) : (
        <Alert data-testid="overview-vazio">
          Nenhuma redação devolvida ainda. O resumo aparece depois da primeira devolutiva.
        </Alert>
      )}
    </div>
  );
}

function Indicador({ rotulo, testId, valor, children }: { rotulo: string; testId: string; valor: number; children?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className={ROTULO}>{rotulo}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold leading-none tracking-tight tabular-nums" data-testid={testId} data-valor={valor}>{valor}</span>
        {children}
      </div>
    </Card>
  );
}

function Indicadores({ overview }: { overview: Overview }) {
  const devolvidas = overview.historico.length;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Indicador rotulo="Última nota" testId="overview-ultima-nota" valor={overview.total}>
        {devolvidas > 1 && (
          <span className={cn("text-sm font-bold", corDaDiferenca(overview.evolucao))} data-testid="overview-evolucao-total" data-diferenca={overview.evolucao}>
            {comSinal(overview.evolucao)} <span className="font-medium text-muted-foreground">desde a 1ª</span>
          </span>
        )}
      </Indicador>
      <Indicador rotulo="Melhor nota" testId="overview-melhor-nota" valor={overview.melhorTotal} />
      <Indicador rotulo="Devolvidas" testId="overview-devolvidas" valor={devolvidas} />
      <Indicador rotulo="Em andamento" testId="overview-em-andamento" valor={overview.emAndamento} />
    </div>
  );
}

function Competencias({ overview, ultimas }: { overview: Overview; ultimas: NotasCompetencias }) {
  const { primeiras, insights, maisForte, historico } = overview;
  const comparar = historico.length > 1 && primeiras;
  return (
    <Card className="grid gap-6 p-5 md:grid-cols-[280px_minmax(0,1fr)]">
      <div className="grid content-start justify-items-center gap-2" data-testid="overview-radar" data-valores={ultimas.join(",")}>
        <RadarCompetencias
          series={[
            ...(comparar ? [{ valores: primeiras, variante: "referencia" as const, nome: "1ª versão" }] : []),
            { valores: ultimas, variante: "principal" as const, nome: "Última versão" },
          ]}
        />
        <LegendaSeries
          className="justify-center"
          itens={[
            { variante: "principal", rotulo: `Última (v${historico.at(-1)!.versao})`, valores: ultimas, testId: "overview-serie-ultima" },
            ...(comparar ? [{ variante: "referencia" as const, rotulo: `1ª (v${historico[0].versao})`, valores: primeiras, testId: "overview-serie-primeira" }] : []),
          ]}
        />
        <div className="mt-2 w-full">
          <p className={ROTULO}>Evolução · {historico.length} {historico.length === 1 ? "redação" : "redações"}</p>
          <LinhaEvolucao totais={historico.map(notaTotal)} largura={260} altura={80} data-testid="overview-evolucao" />
        </div>
      </div>

      <div className="grid content-start gap-4">
        <ul className="grid gap-2" aria-label="Competências">
          {COMPETENCIAS.map((c, i) => (
            <LinhaCompetencia
              key={c}
              competencia={c}
              nota={ultimas[i]}
              diferenca={comparar ? ultimas[i] - primeiras[i] : null}
              erros={overview.pontosDeAtencao[c].erro}
              atencoes={overview.pontosDeAtencao[c].atencao}
            />
          ))}
        </ul>

        <div className="grid gap-2 text-sm">
          {maisForte && (
            <p className="flex flex-wrap items-baseline gap-2" data-testid="overview-mais-forte" data-competencia={`c${maisForte}`}>
              <Badge variant="acerto" className="text-foreground">Mais forte</Badge>
              <span><b>C{maisForte}</b> {NOME_COMPETENCIA[maisForte].toLowerCase()}</span>
            </p>
          )}
          {insights?.avanco && (
            <p className="flex flex-wrap items-baseline gap-2" data-testid="overview-avanco" data-competencia={`c${insights.avanco}`}>
              <Badge variant="acerto" className="text-foreground">Mais avançou</Badge>
              <span><b>C{insights.avanco}</b> {NOME_COMPETENCIA[insights.avanco].toLowerCase()} ({comSinal(insights.ganho)} desde a 1ª)</span>
            </p>
          )}
          {insights && (
            <p className="flex flex-wrap items-baseline gap-2" data-testid="overview-foco" data-competencia={`c${insights.foco}`}>
              <Badge variant="atencao">Foco agora</Badge>
              <span><b>C{insights.foco}</b> {NOME_COMPETENCIA[insights.foco].toLowerCase()}</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface LinhaCompetenciaProps {
  competencia: Competencia;
  nota: number;
  diferenca: number | null;
  erros: number;
  atencoes: number;
}

function LinhaCompetencia({ competencia, nota, diferenca, erros, atencoes }: LinhaCompetenciaProps) {
  return (
    <li
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-muted px-3 py-2"
      data-testid={`overview-competencia-c${competencia}`}
      data-nota={nota}
      data-diferenca={diferenca ?? undefined}
      data-erros={erros}
      data-atencoes={atencoes}
    >
      <span className="text-xs font-bold text-muted-foreground">C{competencia}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{NOME_COMPETENCIA[competencia]}</div>
        <div className="text-xs text-muted-foreground">
          {erros} {erros === 1 ? "erro" : "erros"} · {atencoes} {atencoes === 1 ? "atenção" : "atenções"} nas redações
        </div>
      </div>
      <div className="text-right">
        <b className="tabular-nums">{nota}</b>
        {diferenca !== null && <span className={cn("block text-xs font-bold", corDaDiferenca(diferenca))}>{comSinal(diferenca)}</span>}
      </div>
    </li>
  );
}

function Versoes({ overview, visao }: { overview: Overview; visao: Papel }) {
  const versoes = [...overview.historico].reverse();
  return (
    <Card className="overflow-hidden">
      <div className="border-b px-5 py-3">
        <p className="text-sm font-bold">Versões devolvidas</p>
        <p className="text-xs text-muted-foreground">Toque numa versão para abrir a folha marcada.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums" data-testid="overview-versoes">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-5 py-2 text-left">Versão</th>
              {COMPETENCIAS.map((c) => (
                <th key={c} scope="col" title={NOME_COMPETENCIA[c]} className="px-2 py-2">C{c}</th>
              ))}
              <th scope="col" className="px-2 py-2">Total</th>
              <th scope="col" className="w-8"><span className="sr-only">Abrir</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {versoes.map((r) => (
              <tr key={r.id} className="hover:bg-muted/60" data-testid={`overview-versao-${r.id}`} data-versao={r.versao} data-total={notaTotal(r)}>
                <th scope="row" className="px-5 py-2 text-left font-semibold">
                  <a href={`#/redacoes/${r.id}?visao=${visao}`} className="hover:text-primary" data-testid={`overview-versao-abrir-${r.id}`}>
                    v{r.versao}
                    {r.devolvidaEm && <span className="ml-2 text-xs font-normal text-muted-foreground">{dataCurta(r.devolvidaEm)}</span>}
                  </a>
                </th>
                {notasPorCompetencia(r).map((n, i) => (
                  <td key={i} className="px-2 py-2 text-center">{n}</td>
                ))}
                <td className="px-2 py-2 text-center font-bold">{notaTotal(r)}</td>
                <td className="pr-3 text-muted-foreground"><ChevronRight className="size-4" aria-hidden="true" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
