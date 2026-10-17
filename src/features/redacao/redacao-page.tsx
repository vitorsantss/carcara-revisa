import * as React from "react";
import { Check, Eye, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useApp, useRedacao } from "@/store/app-store";
import { navegar } from "@/lib/router";
import { ALUNOS, PROPOSTA, TURMAS } from "@/domain/seed";
import type { EtapaRedacao, Papel } from "@/domain/types";
import { EssayDocument } from "./essay-document";
import { Revisao } from "@/features/revisao/revisao";
import { Devolutiva } from "@/features/devolutiva/devolutiva";
import { cn, tempoRelativo } from "@/lib/utils";

const ETAPAS: Array<{ id: EtapaRedacao; rotulo: string }> = [
  { id: "enviada", rotulo: "Enviada" },
  { id: "em_revisao", rotulo: "Em revisão" },
  { id: "devolvida", rotulo: "Devolvida" },
];

/**
 * Uma redação, duas visões. O toggle alterna entre o que o aluno vê
 * e o que o professor vê, sem sair da redação.
 */
export function RedacaoPage({ id, visao }: { id: string; visao: Papel }) {
  const { despachar } = useApp();
  const redacao = useRedacao(id);

  React.useEffect(() => {
    despachar({ type: "definir_papel", papel: visao });
    if (visao === "professor" && redacao?.etapa === "enviada") despachar({ type: "iniciar_revisao", redacaoId: id });
  }, [visao, id, redacao?.etapa, despachar]);

  if (!redacao) {
    return <Alert data-testid="redacao-nao-encontrada">Redação não encontrada.</Alert>;
  }
  const aluno = ALUNOS.find((a) => a.id === redacao.alunoId)!;
  const turma = TURMAS.find((t) => t.id === aluno.turmaId)!;
  const idxEtapa = ETAPAS.findIndex((e) => e.id === redacao.etapa);

  return (
    <div className="mx-auto max-w-6xl" data-testid="redacao-page" data-etapa={redacao.etapa} data-visao={visao}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4" data-print="hide">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight" data-testid="redacao-aluno">{aluno.nome}</h2>
          <p className="text-sm text-muted-foreground">
            {turma.nome} · enviada {tempoRelativo(redacao.enviadaEm)}
            {redacao.versao > 1 ? ` · reescrita v${redacao.versao}` : ""}
          </p>
        </div>
        <ol className="flex items-center gap-2 text-xs font-semibold" data-testid="redacao-etapas" aria-label="Andamento">
          {ETAPAS.map((e, i) => (
            <li key={e.id} className="flex items-center gap-2" data-testid={`etapa-${e.id}`} data-state={i < idxEtapa ? "feita" : i === idxEtapa ? "atual" : "futura"}>
              <span className={cn("grid size-6 place-items-center rounded-full border", i <= idxEtapa ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground")}>
                {i < idxEtapa ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={i <= idxEtapa ? "" : "text-muted-foreground"}>{e.rotulo}</span>
              {i < ETAPAS.length - 1 && <span className="h-px w-5 bg-border" />}
            </li>
          ))}
        </ol>
        <ToggleGroup
          type="single"
          aria-label="Visão"
          data-testid="visao-toggle"
          value={visao}
          onValueChange={(v) => navegar(`/redacoes/${id}?visao=${v}`)}
          items={[
            { value: "aluno", label: <><Eye className="size-4" /> Visão do aluno</>, testId: "visao-aluno" },
            { value: "professor", label: <><GraduationCap className="size-4" /> Visão do professor</>, testId: "visao-professor" },
          ]}
        />
      </div>

      {visao === "professor" ? (
        <Revisao redacao={redacao} onDevolvida={() => navegar(`/redacoes/${id}?visao=aluno`)} />
      ) : redacao.etapa === "devolvida" ? (
        <Devolutiva redacao={redacao} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]" data-testid="aluno-aguardando">
          <EssayDocument testId="aluno-folha" tema={PROPOSTA.tema} titulo={redacao.titulo} texto={redacao.texto} marcacoes={[]} />
          <Card className="h-fit p-5">
            <Badge variant="highlight" data-testid="aluno-status">{redacao.etapa === "enviada" ? "Aguardando professor" : "Em revisão"}</Badge>
            <h3 className="mt-3 text-base font-bold">Sua redação chegou</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              O professor está corrigindo. Você recebe a devolutiva com os trechos marcados assim que ele terminar.
            </p>
            {redacao.duvidasDeTranscricao > 0 && (
              <p className="mt-3 text-xs text-muted-foreground" data-testid="aluno-duvidas">
                {redacao.duvidasDeTranscricao} palavras da foto foram conferidas por você antes do envio.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
