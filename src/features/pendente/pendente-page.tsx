import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALUNOS, INSTITUICAO, PROFESSORES, PROPOSTA, TURMAS } from "@/domain/seed";

interface Tela {
  titulo: string;
  descricao: string;
  recursos: string[];
  entidade: string;
  campos: string[];
  exemplo: string[];
}

export const TELAS_PENDENTES: Record<string, Tela> = {
  turmas: {
    titulo: "Minhas turmas",
    descricao: "Turmas do professor com o andamento de cada proposta.",
    recursos: ["Lista de turmas e alunos", "Entregas por proposta (enviadas, em revisão, devolvidas)", "Atalho para a fila filtrada da turma"],
    entidade: "Turma",
    campos: ["id", "nome", "anoLetivo", "instituicaoId", "professorIds[]"],
    exemplo: TURMAS.map((t) => `${t.nome} · ${ALUNOS.filter((a) => a.turmaId === t.id).length} alunos`),
  },
  propostas: {
    titulo: "Propostas",
    descricao: "Criação de propostas de redação com tema, textos motivadores e prazo.",
    recursos: ["Tema e textos motivadores", "Turmas atribuídas e prazo", "Comparação com os motivadores para detectar cópia"],
    entidade: "Proposta",
    campos: ["id", "tema", "motivadores[]", "turmaIds[]", "prazo"],
    exemplo: [`${PROPOSTA.tema} · prazo ${PROPOSTA.prazo}`],
  },
  instituicao: {
    titulo: "Visão geral da instituição",
    descricao: "Painel da coordenação com volume de correções e tempo de devolutiva.",
    recursos: ["Redações por turma e professor", "Tempo médio até a devolutiva", "Calibragem agregada dos professores"],
    entidade: "Instituição",
    campos: ["id", "nome", "cidade", "plano", "responsavelId"],
    exemplo: [`${INSTITUICAO.nome} · ${INSTITUICAO.cidade}`],
  },
  professores: {
    titulo: "Professores",
    descricao: "Cadastro de professores e vínculo com turmas.",
    recursos: ["Convite por e-mail", "Turmas atribuídas", "Calibragem individual"],
    entidade: "Professor",
    campos: ["id", "nome", "email", "instituicaoId", "turmaIds[]"],
    exemplo: PROFESSORES.map((p) => `${p.nome} · ${p.turmaIds.length} turma(s)`),
  },
  alunos: {
    titulo: "Alunos",
    descricao: "Cadastro de alunos, com consentimento dos responsáveis para menores de idade.",
    recursos: ["Importação por planilha", "Consentimento LGPD do responsável", "Histórico de redações"],
    entidade: "Aluno",
    campos: ["id", "nome", "turmaId", "dataConsentimento", "responsavelEmail"],
    exemplo: ALUNOS.slice(0, 3).map((a) => a.nome),
  },
  configuracoes: {
    titulo: "Configurações",
    descricao: "Regras da instituição para a correção.",
    recursos: ["Limiar de pré-aprovação (padrão 95% em 30 casos)", "Retenção de dados e exclusão a pedido", "Integração com plataforma da escola"],
    entidade: "Configuração",
    campos: ["instituicaoId", "limiarConcordancia", "casosMinimos", "retencaoDias"],
    exemplo: ["limiarConcordancia: 0.95 · casosMinimos: 30"],
  },
};

export function PendentePage({ slug }: { slug: string }) {
  const t = TELAS_PENDENTES[slug];
  if (!t) return <p data-testid="pendente-desconhecida">Tela não encontrada.</p>;
  return (
    <div className="mx-auto max-w-3xl" data-testid={`pendente-${slug}`}>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-secondary/60 px-5 py-4">
          <Construction className="size-5 text-primary" />
          <div className="flex-1">
            <div className="font-bold" data-testid="pendente-titulo">{t.titulo}</div>
            <div className="text-sm text-muted-foreground">{t.descricao}</div>
          </div>
          <Badge variant="highlight" data-testid="pendente-badge">Pendente de implementação</Badge>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">O que esta tela vai ter</CardTitle>
            <CardContent className="p-0">
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm">{t.recursos.map((r) => <li key={r}>{r}</li>)}</ul>
            </CardContent>
          </CardHeader>
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Exemplo do que vai aparecer</CardTitle>
            <ul className="mt-2 text-sm">{t.exemplo.map((e) => <li key={e}>{e}</li>)}</ul>
            <details className="mt-3 text-xs text-muted-foreground" data-testid="pendente-detalhes-tecnicos">
              <summary className="cursor-pointer">Detalhes técnicos (para a equipe)</summary>
              <div className="mt-2">Entidade: {t.entidade}</div>
              <CardDescription className="mt-1 flex flex-wrap gap-1.5" data-testid="pendente-campos">
                {t.campos.map((c) => <code key={c} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{c}</code>)}
              </CardDescription>
            </details>
          </CardHeader>
        </div>
      </Card>
    </div>
  );
}
