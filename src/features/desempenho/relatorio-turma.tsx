import { GradeTurma } from "@/components/charts/grade-turma";
import { RadarCompetencias } from "@/components/charts/radar-competencias";
import { alunosEmRisco, somaDasNotas, type DesempenhoAluno } from "@/domain/regras";
import { NOME_COMPETENCIA, type Competencia, type NotasCompetencias } from "@/domain/types";

interface RelatorioTurmaProps {
  turma: string;
  instituicao: string;
  geradoEm: string;
  desempenho: DesempenhoAluno[];
  media: NotasCompetencias;
  maisFraca: Competencia;
}

/** Relatório da turma para imprimir: radar da média, média total, competência mais fraca, alunos em risco e a grade. */
export function RelatorioTurma({ turma, instituicao, geradoEm, desempenho, media, maisFraca }: RelatorioTurmaProps) {
  const emRisco = alunosEmRisco(desempenho, maisFraca);
  return (
    <section data-print="resumo" data-testid="desempenho-pdf-turma" className="mx-auto max-w-3xl text-sm">
      <h2 className="text-lg font-extrabold">{turma} · Desempenho em redação</h2>
      <p className="mb-4 text-muted-foreground">{instituicao} · gerado em {geradoEm}</p>
      <div className="grid grid-cols-2 items-center gap-4">
        <RadarCompetencias tamanho={220} animar={false} series={[{ valores: media, variante: "principal", nome: `Média ${turma}` }]} />
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Média da turma</p>
          <span className="text-3xl font-extrabold tabular-nums">{somaDasNotas(media)}</span>
          <p className="mt-2">
            Mais fraca: <b>C{maisFraca}</b> {NOME_COMPETENCIA[maisFraca].toLowerCase()}
            <br />
            Alunos com até 80 em C{maisFraca}: <b>{emRisco.length ? emRisco.map((d) => d.nome.split(" ")[0]).join(", ") : "nenhum"}</b>
          </p>
        </div>
      </div>
      <GradeTurma className="mt-4" prefixo="pdf-grade" linhas={desempenho} media={media} maisFraca={maisFraca} />
      <p className="mt-4 text-xs text-muted-foreground">Sem texto de redação. Só o professor da turma gera este arquivo, e cada exportação fica registrada.</p>
    </section>
  );
}
