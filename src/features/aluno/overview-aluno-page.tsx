import { Alert } from "@/components/ui/misc";
import { ALUNOS, PROFESSORES, USUARIO_ALUNO, USUARIO_PROFESSOR } from "@/domain/seed";
import { podeVerAluno } from "@/domain/regras";
import { OverviewAluno } from "./overview-aluno";

export function MeuDesempenhoPage() {
  const aluno = ALUNOS.find((a) => a.id === USUARIO_ALUNO)!;
  return <OverviewAluno aluno={aluno} visao="aluno" />;
}

export function OverviewAlunoProfessorPage({ alunoId }: { alunoId: string }) {
  const aluno = ALUNOS.find((a) => a.id === alunoId);
  const professor = PROFESSORES.find((p) => p.id === USUARIO_PROFESSOR);
  if (!aluno || !podeVerAluno(professor, aluno)) {
    return (
      <Alert className="mx-auto max-w-3xl" data-testid="overview-nao-encontrado">
        Aluno não encontrado nas suas turmas. <a href="#/professor/desempenho" className="font-semibold text-primary underline">Voltar para Desempenho</a>
      </Alert>
    );
  }
  return <OverviewAluno aluno={aluno} visao="professor" />;
}
