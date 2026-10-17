import * as React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { useApp, useRedacao } from "@/store/app-store";
import { ALUNOS, PROPOSTA, TURMAS } from "@/domain/seed";
import { TEXTO_ALERTA, dataPrevistaDevolutiva } from "@/domain/regras";
import type { EtapaRedacao, Papel, Redacao } from "@/domain/types";
import { EssayDocument } from "./essay-document";
import { GlossarioCompetencias } from "./glossario";
import { Revisao } from "@/features/revisao/revisao";
import { Devolutiva } from "@/features/devolutiva/devolutiva";
import { cn, dataCurta, tempoRelativo } from "@/lib/utils";

const ETAPAS: Array<{ id: EtapaRedacao; rotulo: string }> = [
  { id: "enviada", rotulo: "Enviada" },
  { id: "em_revisao", rotulo: "Em revisão" },
  { id: "devolvida", rotulo: "Devolvida" },
];

/**
 * Uma redação, duas visões: a do professor (revisão) e a do aluno (aguardando ou devolutiva).
 * A visão segue o papel atual; o professor confere o que o aluno vai receber pela prévia da revisão.
 */
export function RedacaoPage({ id, visao }: { id: string; visao: Papel }) {
  const { despachar } = useApp();
  const redacao = useRedacao(id);

  React.useEffect(() => {
    if (visao === "professor" && redacao?.etapa === "enviada") despachar({ type: "iniciar_revisao", redacaoId: id });
  }, [visao, id, redacao?.etapa, despachar]);

  if (!redacao) {
    return <Alert data-testid="redacao-nao-encontrada">Redação não encontrada.</Alert>;
  }
  const aluno = ALUNOS.find((a) => a.id === redacao.alunoId)!;
  const turma = TURMAS.find((t) => t.id === aluno.turmaId)!;
  const idxEtapa = ETAPAS.findIndex((e) => e.id === redacao.etapa);

  return (
    <div className="mx-auto max-w-6xl" data-testid="redacao-page" data-etapa={redacao.etapa} data-visao={visao} data-versao={redacao.versao}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4" data-print="hide">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight" data-testid="redacao-aluno">{aluno.nome}</h2>
          <p className="text-sm text-muted-foreground">
            {turma.nome} · enviada {tempoRelativo(redacao.enviadaEm)}
            {redacao.versao > 1 ? ` · reescrita v${redacao.versao}` : ""}
          </p>
        </div>
        <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold" data-testid="redacao-etapas" aria-label="Andamento">
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
      </div>

      {visao === "professor" ? (
        <Revisao redacao={redacao} />
      ) : redacao.etapa === "devolvida" ? (
        <Devolutiva redacao={redacao} />
      ) : (
        <AlunoAguardando redacao={redacao} />
      )}
    </div>
  );
}

function AlunoAguardando({ redacao }: { redacao: Redacao }) {
  const previsao = dataPrevistaDevolutiva(redacao, PROPOSTA);
  const alertas = (redacao.alertas ?? []).filter((a) => a !== "texto_repetido");
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]" data-testid="aluno-aguardando">
      <EssayDocument testId="aluno-folha" tema={PROPOSTA.tema} titulo={redacao.titulo} texto={redacao.texto} marcacoes={[]} />
      <div className="grid h-fit gap-4">
        <Card className="p-5">
          <Badge variant="highlight" data-testid="aluno-status">{redacao.etapa === "enviada" ? "Aguardando professor" : "Em revisão"}</Badge>
          <h3 className="mt-3 text-base font-bold">Sua redação chegou ao professor</h3>
          <ol className="mt-2 grid gap-1.5 text-sm text-muted-foreground" data-testid="aluno-proximos-passos">
            <li><b className="text-foreground">1.</b> Uma correção automática faz a primeira leitura.</li>
            <li><b className="text-foreground">2.</b> Seu professor revisa, ajusta e assina a correção.</li>
            <li><b className="text-foreground">3.</b> Você recebe a folha marcada aqui, em <a href="#/aluno/redacoes" className="font-semibold text-primary underline underline-offset-2">Minhas redações</a>.</li>
          </ol>
          <p className="mt-3 text-sm" data-testid="aluno-previsao">
            Previsão de devolutiva: <b>até {dataCurta(previsao)}</b> ({PROPOSTA.diasParaDevolutiva} dias combinados pela turma).
          </p>
          {redacao.duvidasDeTranscricao > 0 && (
            <p className="mt-3 text-xs text-muted-foreground" data-testid="aluno-duvidas">
              Você conferiu as {redacao.duvidasDeTranscricao} palavras em que a leitura da sua letra teve dúvida. Se o resto do texto ficou diferente do que você escreveu, avise seu professor.
            </p>
          )}
        </Card>
        <GlossarioCompetencias testId="aluno-glossario" />
        {alertas.length > 0 && (
          <Card className="grid gap-2 p-5" data-testid="aluno-alertas">
            <h3 className="flex items-center gap-2 text-sm font-bold"><AlertTriangle className="size-4 text-atencao" /> Pontos que o professor vai conferir</h3>
            <ul className="grid gap-1.5 text-sm">
              {alertas.map((a) => <li key={a} data-testid={`aluno-alerta-${a}`}>{TEXTO_ALERTA[a].aluno}</li>)}
            </ul>
            <p className="text-xs text-muted-foreground">Quem decide a nota é o professor. Se algum desses pontos se confirmar, a devolutiva explica o que fazer na próxima.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
