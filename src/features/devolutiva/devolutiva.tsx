import * as React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { PROPOSTA } from "@/domain/seed";
import type { Redacao, Tipo } from "@/domain/types";
import { COMPETENCIAS, NOME_COMPETENCIA, NOME_TIPO } from "@/domain/types";
import { comentarioVisivel, notaFinal, notaTotal, visivelParaAluno } from "@/domain/regras";
import { EssayDocument, PontoTipo, bordaTipo } from "@/features/redacao/essay-document";
import { cn } from "@/lib/utils";

const TIPOS: Tipo[] = ["acerto", "atencao", "erro"];

/**
 * Devolutiva do aluno: folha marcada + comentários na margem, alinhados ao trecho
 * (estilo comentários do Notion). O filtro por cor também vale para a exportação.
 */
export function Devolutiva({ redacao }: { redacao: Redacao }) {
  const [filtro, setFiltro] = React.useState<string[]>(TIPOS);
  const [ativa, setAtiva] = React.useState<string | null>(null);
  const docRef = React.useRef<HTMLDivElement>(null);
  const margemRef = React.useRef<HTMLDivElement>(null);

  const visiveis = redacao.marcacoes.filter(visivelParaAluno);
  const filtradas = visiveis.filter((m) => filtro.includes(m.tipo));
  const numeracao = Object.fromEntries(filtradas.map((m, i) => [m.id, i + 1]));
  const contar = (t: Tipo) => visiveis.filter((m) => m.tipo === t).length;

  const posicionar = React.useCallback(() => {
    const margem = margemRef.current;
    const doc = docRef.current;
    if (!margem || !doc) return;
    const cards = Array.from(margem.querySelectorAll<HTMLElement>("[data-card]"));
    if (getComputedStyle(margem).position !== "relative") {
      cards.forEach((c) => (c.style.top = ""));
      margem.style.height = "";
      return;
    }
    const base = margem.getBoundingClientRect().top;
    const alvo = cards.map((c) => {
      const mk = doc.querySelector(`[data-testid="marca-${c.dataset.card}"]`);
      return mk ? mk.getBoundingClientRect().top - base - 6 : 0;
    });
    const pos: number[] = [];
    let fundo = 0;
    cards.forEach((c, i) => {
      const t = Math.max(alvo[i], fundo);
      pos.push(t);
      fundo = t + c.offsetHeight + 8;
    });
    const idx = cards.findIndex((c) => c.dataset.card === ativa);
    if (idx >= 0 && pos[idx] > alvo[idx]) {
      const desloca = pos[idx] - alvo[idx];
      for (let j = idx; j >= 0; j--) pos[j] -= desloca;
      let b = 0;
      for (let j = 0; j < cards.length; j++) {
        pos[j] = Math.max(pos[j], b);
        b = pos[j] + cards[j].offsetHeight + 8;
      }
      fundo = b;
    }
    cards.forEach((c, i) => (c.style.top = `${Math.max(0, pos[i])}px`));
    margem.style.height = `${Math.max(doc.offsetHeight, fundo)}px`;
  }, [ativa]);

  React.useLayoutEffect(() => {
    posicionar();
  });
  React.useEffect(() => {
    window.addEventListener("resize", posicionar);
    return () => window.removeEventListener("resize", posicionar);
  }, [posicionar]);

  const passos = COMPETENCIAS.map((c) => ({ c, nota: notaFinal(redacao, c), passo: redacao.avaliacaoAutomatica[c].proximoPasso }))
    .filter((x) => x.passo)
    .sort((a, b) => a.nota - b.nota)
    .slice(0, 3);

  return (
    <div data-testid="devolutiva">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-4xl font-bold leading-none" data-testid="devolutiva-nota-total">
            {notaTotal(redacao)} <span className="text-base font-medium text-muted-foreground">/ 1000</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5" data-testid="devolutiva-notas">
            {COMPETENCIAS.map((c) => (
              <span key={c} title={NOME_COMPETENCIA[c]} className="rounded-md border bg-card px-2 py-0.5 font-mono text-xs" data-testid={`devolutiva-nota-c${c}`}>
                <b className="mr-1 text-muted-foreground">C{c}</b>{notaFinal(redacao, c)}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" data-print="hide">
          <ToggleGroup
            type="multiple"
            aria-label="Mostrar na folha"
            data-testid="devolutiva-filtro"
            value={filtro}
            onValueChange={setFiltro}
            items={TIPOS.map((t) => ({
              value: t,
              testId: `devolutiva-filtro-${t}`,
              label: (
                <>
                  <PontoTipo tipo={t} /> {t === "acerto" ? "Acertos" : t === "erro" ? "Erros" : "Atenção"}
                  <span className="font-mono text-xs opacity-70">{contar(t)}</span>
                </>
              ),
            }))}
          />
          <Button variant="outline" onClick={() => window.print()} data-testid="devolutiva-exportar">
            <Printer /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <EssayDocument
          ref={docRef}
          testId="devolutiva-folha"
          tema={PROPOSTA.tema}
          titulo={redacao.titulo}
          texto={redacao.texto}
          marcacoes={filtradas}
          ativa={ativa}
          onMarcaClick={setAtiva}
          numeracao={numeracao}
        />
        <div ref={margemRef} className="relative max-lg:static max-lg:grid max-lg:gap-2" data-testid="devolutiva-margem">
          {!filtradas.length && <p className="text-sm text-muted-foreground" data-testid="devolutiva-margem-vazia">Nenhuma marcação com este filtro.</p>}
          {filtradas.map((m) => (
            <Card
              key={m.id}
              data-card={m.id}
              data-testid={`comentario-${m.id}`}
              data-tipo={m.tipo}
              onClick={() => setAtiva(m.id)}
              className={cn("left-0 right-0 grid cursor-pointer gap-1 border-l-[3px] p-3 transition-[top] lg:absolute", bordaTipo(m.tipo), ativa === m.id && "ring-2 ring-ring")}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <PontoTipo tipo={m.tipo} />
                <span className="font-mono font-semibold">C{m.competencia}</span>
                <span>{NOME_TIPO[m.tipo]} · #{numeracao[m.id]}</span>
                <span className="ml-auto" data-testid="comentario-autor">{m.origem === "professor" ? "Professor" : "Correção automática"}</span>
              </div>
              <p className="text-sm">{comentarioVisivel(m)}</p>
              {m.sugestao && <p className="text-xs text-muted-foreground">Sugestão: {m.sugestao}</p>}
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-6 p-5" data-testid="devolutiva-missoes">
        <h3 className="mb-2 text-sm font-bold">Para a reescrita</h3>
        <ol className="grid list-decimal gap-1.5 pl-5 text-sm">
          {passos.map((p) => (
            <li key={p.c} data-testid={`missao-c${p.c}`}>
              <span className="mr-1 font-mono text-xs font-semibold text-muted-foreground">C{p.c}</span>
              {p.passo}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Na próxima versão, cada trecho marcado é conferido de novo.</p>
      </Card>
    </div>
  );
}
