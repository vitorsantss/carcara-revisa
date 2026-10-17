import { cn } from "@/lib/utils";
import type { NotasCompetencias } from "@/domain/types";

export interface ItemLegenda {
  variante: "principal" | "referencia";
  rotulo: string;
  valores?: NotasCompetencias;
  testId?: string;
}

/** Legenda em texto das séries do radar: linha cheia para a principal, tracejada para a referência. */
export function LegendaSeries({ itens, className }: { itens: ItemLegenda[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {itens.map((it) => (
        <li key={it.rotulo} className="inline-flex items-center gap-1.5" data-testid={it.testId} data-variante={it.variante} data-valores={it.valores?.join(",")}>
          <i aria-hidden="true" className={cn("h-0 w-4 border-t-2", it.variante === "principal" ? "border-serie" : "border-dashed border-serie-ref")} />
          {it.rotulo}
        </li>
      ))}
    </ul>
  );
}
