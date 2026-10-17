import * as React from "react";
import type { Marcacao } from "@/domain/types";
import { NOME_COMPETENCIA, NOME_TIPO } from "@/domain/types";
import { cn } from "@/lib/utils";

interface Props {
  tema: string;
  titulo?: string;
  texto: string;
  marcacoes: Marcacao[];
  ativa?: string | null;
  onMarcaClick?: (id: string) => void;
  numeracao?: Record<string, number>;
  className?: string;
  testId: string;
}

/**
 * Folha da redação com trechos marcados. Cada pedaço de texto guarda seu
 * deslocamento (data-offset) para converter uma seleção do mouse em posição no texto.
 */
export const EssayDocument = React.forwardRef<HTMLDivElement, Props>(function EssayDocument(
  { tema, titulo, texto, marcacoes, ativa, onMarcaClick, numeracao, className, testId },
  ref,
) {
  const paragrafos: React.ReactNode[] = [];
  let off = 0;
  texto.split("\n").forEach((para, pi) => {
    const a = off;
    const b = off + para.length;
    off = b + 1;
    if (!para.trim()) return;
    const partes: React.ReactNode[] = [];
    let c = a;
    for (const m of marcacoes.filter((x) => x.inicio >= a && x.fim <= b)) {
      if (m.inicio > c) partes.push(<span key={`t${c}`} data-offset={c}>{texto.slice(c, m.inicio)}</span>);
      partes.push(
        <mark
          key={m.id}
          className="mark"
          tabIndex={0}
          data-testid={`marca-${m.id}`}
          data-tipo={m.tipo}
          data-origem={m.origem}
          data-status={m.status}
          data-active={ativa === m.id}
          title={`C${m.competencia} · ${NOME_COMPETENCIA[m.competencia]} · ${NOME_TIPO[m.tipo]}`}
          onClick={() => onMarcaClick?.(m.id)}
          onKeyDown={(e) => e.key === "Enter" && onMarcaClick?.(m.id)}
        >
          <span data-offset={m.inicio}>{texto.slice(m.inicio, m.fim)}</span>
          {numeracao?.[m.id] && <sup>{numeracao[m.id]}</sup>}
        </mark>,
      );
      c = m.fim;
    }
    if (c < b) partes.push(<span key={`t${c}`} data-offset={c}>{texto.slice(c, b)}</span>);
    paragrafos.push(
      <p key={pi} className="mb-4 indent-8 font-serif text-[17px] leading-[1.85]" data-testid={`${testId}-paragrafo-${pi}`}>
        {partes}
      </p>,
    );
  });

  return (
    <div ref={ref} data-testid={testId} className={cn("rounded-md border bg-paper px-6 py-8 shadow-xs md:px-12", className)}>
      <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{tema}</p>
      {titulo && <h3 className="mb-5 text-center font-serif text-xl font-semibold">{titulo}</h3>}
      {paragrafos}
    </div>
  );
});

/** Converte uma seleção do navegador em [início, fim] no texto da redação. */
export function selecaoParaOffsets(container: HTMLElement): { inicio: number; fim: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!container.contains(r.startContainer) || !container.contains(r.endContainer)) return null;
  const pos = (node: Node, offset: number) => {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
    const seg = el?.closest<HTMLElement>("[data-offset]");
    if (!seg) return null;
    return Number(seg.dataset.offset) + (node.nodeType === Node.TEXT_NODE ? offset : 0);
  };
  const inicio = pos(r.startContainer, r.startOffset);
  const fim = pos(r.endContainer, r.endOffset);
  if (inicio === null || fim === null || fim - inicio < 2) return null;
  return { inicio, fim };
}

export function LegendaTipos({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)} data-testid="legenda-tipos">
      <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-acerto" />Acerto</span>
      <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-atencao" />Atenção</span>
      <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-erro" />Erro</span>
      <span>Listrado = correção do professor</span>
    </div>
  );
}

export function PontoTipo({ tipo }: { tipo: Marcacao["tipo"] }) {
  const cor = tipo === "acerto" ? "bg-acerto" : tipo === "atencao" ? "bg-atencao" : "bg-erro";
  return <i className={cn("inline-block size-2.5 shrink-0 rounded-full", cor)} aria-hidden="true" />;
}

export const bordaTipo = (tipo: Marcacao["tipo"]) =>
  tipo === "acerto" ? "border-l-acerto" : tipo === "atencao" ? "border-l-atencao" : "border-l-erro";
