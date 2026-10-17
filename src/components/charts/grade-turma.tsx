import { cn } from "@/lib/utils";
import { COMPETENCIAS, NOME_COMPETENCIA, type Competencia, type NotasCompetencias } from "@/domain/types";

export interface LinhaGrade {
  alunoId: string;
  nome: string;
  notas: NotasCompetencias;
  total: number;
}

interface GradeTurmaProps {
  linhas: LinhaGrade[];
  media: NotasCompetencias;
  maisFraca: Competencia;
  onAluno?: (alunoId: string) => void;
  className?: string;
}

/** Escala de um tom só: quanto maior a nota, mais forte a cor da série. O número aparece sempre. */
const TOM_DA_NOTA: Record<number, string> = {
  0: "bg-serie/5",
  40: "bg-serie/15",
  80: "bg-serie/30",
  120: "bg-serie/45",
  160: "bg-serie/80 text-primary-foreground",
  200: "bg-serie text-primary-foreground",
};

const somar = (n: number[]) => n.reduce((s, v) => s + v, 0);

/** Tabela aluno × competências com total, linha de média e a competência mais fraca destacada. */
export function GradeTurma({ linhas, media, maisFraca, onAluno, className }: GradeTurmaProps) {
  const fraca = (c: Competencia) => c === maisFraca && "outline-2 -outline-offset-2 outline-atencao";
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table
        className="w-full border-separate border-spacing-1 text-sm tabular-nums"
        data-testid="grade-turma"
        data-mais-fraca={`c${maisFraca}`}
        aria-label={`Notas da turma por competência. Competência mais fraca: C${maisFraca} ${NOME_COMPETENCIA[maisFraca]}.`}
      >
        <thead>
          <tr className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="w-[30%] text-left font-bold">Aluno</th>
            {COMPETENCIAS.map((c) => (
              <th
                key={c}
                scope="col"
                title={NOME_COMPETENCIA[c]}
                className="font-bold"
                data-testid={c === maisFraca ? "grade-mais-fraca" : undefined}
                data-competencia={`c${c}`}
              >
                C{c}
                {c === maisFraca && <span className="block text-[9px] font-semibold normal-case tracking-normal text-foreground">mais fraca</span>}
              </th>
            ))}
            <th scope="col" className="font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.alunoId} data-testid={`grade-linha-${l.alunoId}`} className="group cursor-pointer" onClick={() => onAluno?.(l.alunoId)}>
              <th scope="row" className="text-left font-semibold">
                <button
                  type="button"
                  className="cursor-pointer rounded px-1 py-1 text-left group-hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAluno?.(l.alunoId);
                  }}
                  data-testid={`grade-aluno-${l.alunoId}`}
                >
                  {l.nome}
                </button>
              </th>
              {COMPETENCIAS.map((c, i) => (
                <td
                  key={c}
                  title={`C${c} ${NOME_COMPETENCIA[c]}: ${l.notas[i]}`}
                  className={cn("rounded-lg py-2 text-center font-bold", TOM_DA_NOTA[l.notas[i]] ?? "bg-muted", fraca(c))}
                  data-testid={`grade-celula-${l.alunoId}-c${c}`}
                  data-nota={l.notas[i]}
                  data-mais-fraca={c === maisFraca || undefined}
                >
                  {l.notas[i]}
                </td>
              ))}
              <td className="text-center font-bold" data-testid={`grade-total-${l.alunoId}`}>{l.total}</td>
            </tr>
          ))}
          <tr data-testid="grade-media">
            <th scope="row" className="px-1 text-left font-semibold text-muted-foreground">Média</th>
            {COMPETENCIAS.map((c, i) => (
              <td key={c} className={cn("rounded-lg bg-muted py-2 text-center font-bold", fraca(c))} data-testid={`grade-media-c${c}`}>
                {media[i]}
              </td>
            ))}
            <td className="rounded-lg bg-muted text-center font-bold">{somar(media)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
