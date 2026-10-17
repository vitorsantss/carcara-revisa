import { BookOpen, ChevronDown } from "lucide-react";
import { COMPETENCIAS, EXPLICACAO_COMPETENCIA, NOME_COMPETENCIA } from "@/domain/types";
import { cn } from "@/lib/utils";

/** Explicação das 5 competências em linguagem simples, aberta sob demanda. */
export function GlossarioCompetencias({ className, testId = "glossario-competencias" }: { className?: string; testId?: string }) {
  return (
    <details className={cn("group rounded-xl border bg-card p-5 text-sm", className)} data-testid={testId} data-print="hide">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-bold">
        <BookOpen className="size-4 text-primary" /> O que são as 5 competências?
        <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-2 text-muted-foreground">A redação do Enem é avaliada em cinco partes, cada uma valendo de 0 a 200 pontos. A soma dá a nota de 0 a 1000.</p>
      <dl className="mt-3 grid gap-2">
        {COMPETENCIAS.map((c) => (
          <div key={c}>
            <dt className="font-semibold">C{c} · {NOME_COMPETENCIA[c]}</dt>
            <dd className="text-muted-foreground">{EXPLICACAO_COMPETENCIA[c]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
