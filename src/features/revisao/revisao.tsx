import * as React from "react";
import { Check, Pencil, Send, Trash2, Undo2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useApp } from "@/store/app-store";
import { PROPOSTA } from "@/domain/seed";
import type { Competencia, Marcacao, Redacao, Tipo } from "@/domain/types";
import { COMPETENCIAS, NOME_COMPETENCIA, NOME_TIPO, NOTAS_VALIDAS } from "@/domain/types";
import { comentarioVisivel, expandirParaPalavras, notaFinal, notaTotal, pendentes, taxa } from "@/domain/regras";
import { EssayDocument, LegendaTipos, PontoTipo, bordaTipo, selecaoParaOffsets } from "@/features/redacao/essay-document";
import { cn } from "@/lib/utils";

type FiltroCards = "pendentes" | "todas" | "professor";
const MOTIVOS = ["Não procede", "Competência errada", "Tipo errado", "Comentário impreciso"];

export function Revisao({ redacao, onDevolvida }: { redacao: Redacao; onDevolvida: () => void }) {
  const { despachar } = useApp();
  const [filtro, setFiltro] = React.useState<FiltroCards>(pendentes(redacao).length ? "pendentes" : "todas");
  const [ativa, setAtiva] = React.useState<string | null>(null);
  const [editando, setEditando] = React.useState<string | null>(null);
  const [recusando, setRecusando] = React.useState<string | null>(null);
  const [popover, setPopover] = React.useState<{ x: number; y: number; inicio: number; fim: number } | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const docRef = React.useRef<HTMLDivElement>(null);
  const devolvida = redacao.etapa === "devolvida";

  const numeracao = Object.fromEntries(redacao.marcacoes.map((m, i) => [m.id, i + 1]));
  let cards = redacao.marcacoes;
  if (filtro === "pendentes") cards = cards.filter((m) => m.origem === "automatica" && m.status === "pendente").sort((a, b) => (a.confianca ?? 1) - (b.confianca ?? 1));
  if (filtro === "professor") cards = cards.filter((m) => m.origem === "professor");
  const nPend = pendentes(redacao).length;

  const focar = (id: string) => {
    const m = redacao.marcacoes.find((x) => x.id === id);
    if (m && ((filtro === "pendentes" && m.status !== "pendente") || (filtro === "professor" && m.origem !== "professor"))) setFiltro("todas");
    setAtiva(id);
    requestAnimationFrame(() => document.querySelector(`[data-testid="card-${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  const onMouseUp = () => {
    if (devolvida || !docRef.current) return;
    const off = selecaoParaOffsets(docRef.current);
    if (!off) return setPopover(null);
    const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
    setPopover({ ...posicaoDoPopover(rect), ...off });
  };

  const criar = (tipo: Tipo, competencia: Competencia) => {
    if (!popover) return;
    const { inicio, fim } = expandirParaPalavras(redacao.texto, popover.inicio, popover.fim);
    setPopover(null);
    window.getSelection()?.removeAllRanges();
    if (redacao.marcacoes.some((m) => inicio < m.fim && fim > m.inicio)) {
      setAviso("Esse trecho encosta numa marcação existente. Selecione só texto sem cor.");
      return;
    }
    const id = `${redacao.id}-p${Date.now()}`;
    despachar({
      type: "criar_marcacao",
      redacaoId: redacao.id,
      marcacao: { id, competencia, tipo, trecho: redacao.texto.slice(inicio, fim), inicio, fim, comentario: "", origem: "professor", status: "aprovada" },
    });
    setFiltro("professor");
    setAtiva(id);
    setEditando(id);
    setAviso(null);
  };

  return (
    <div data-testid="revisao">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <LegendaTipos />
        <div className="flex flex-wrap items-center gap-1.5" data-testid="revisao-notas">
          {COMPETENCIAS.map((c) => (
            <label key={c} title={NOME_COMPETENCIA[c]} className="flex items-center gap-1 rounded-lg border bg-card pl-2">
              <span className="font-mono text-[11px] font-semibold text-muted-foreground">C{c}</span>
              <NativeSelect
                className="h-8 border-0 bg-transparent font-mono"
                value={notaFinal(redacao, c)}
                disabled={devolvida}
                onChange={(e) => despachar({ type: "definir_nota", redacaoId: redacao.id, competencia: c, nota: Number(e.target.value) })}
                data-testid={`nota-c${c}`}
                aria-label={`Nota C${c}`}
              >
                {NOTAS_VALIDAS.map((n) => <option key={n} value={n}>{n}</option>)}
              </NativeSelect>
            </label>
          ))}
          <span className="ml-1 font-mono text-lg font-bold" data-testid="nota-total">{notaTotal(redacao)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div onMouseUp={onMouseUp} onTouchEnd={() => setTimeout(onMouseUp, 50)}>
          <EssayDocument
            ref={docRef}
            testId="revisao-folha"
            tema={PROPOSTA.tema}
            titulo={redacao.titulo}
            texto={redacao.texto}
            marcacoes={redacao.marcacoes}
            ativa={ativa}
            onMarcaClick={focar}
            numeracao={numeracao}
          />
          {!devolvida && <p className="mt-2 text-center text-xs text-muted-foreground">Selecione um trecho sem cor para criar uma correção sua.</p>}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <ToggleGroup
              type="single"
              size="sm"
              aria-label="Filtrar correções"
              data-testid="revisao-filtro"
              value={filtro}
              onValueChange={(v) => setFiltro(v as FiltroCards)}
              items={[
                { value: "pendentes", label: `Pendentes · ${nPend}`, testId: "revisao-filtro-pendentes" },
                { value: "todas", label: "Todas", testId: "revisao-filtro-todas" },
                { value: "professor", label: "Suas", testId: "revisao-filtro-professor" },
              ]}
            />
          </div>
          <div className="grid max-h-[calc(100vh-260px)] gap-2 overflow-auto p-0.5" data-testid="revisao-cards">
            {!cards.length && (
              <p className="py-4 text-sm text-muted-foreground" data-testid="revisao-cards-vazio">
                {filtro === "pendentes" ? "Nada pendente. Confira as notas e devolva." : filtro === "professor" ? "Selecione um trecho no texto para criar uma correção sua." : "Nada aqui."}
              </p>
            )}
            {cards.map((m) => (
              <CardMarcacao
                key={m.id}
                m={m}
                n={numeracao[m.id]}
                redacao={redacao}
                ativa={ativa === m.id}
                editando={editando === m.id}
                recusando={recusando === m.id}
                bloqueado={devolvida}
                onFocar={() => focar(m.id)}
                setEditando={setEditando}
                setRecusando={setRecusando}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground" data-testid="revisao-resumo">
              {aviso ?? (devolvida ? "Devolutiva enviada" : nPend ? `${nPend} aguardando você` : "Tudo revisado")}
            </span>
            <Button
              onClick={() => { despachar({ type: "devolver", redacaoId: redacao.id }); onDevolvida(); }}
              disabled={nPend > 0 || devolvida}
              data-testid="revisao-devolver"
            >
              <Send /> {devolvida ? "Devolvida" : "Devolver ao aluno"}
            </Button>
          </div>
        </aside>
      </div>

      {popover && (
        <Card className="fixed z-50 grid w-72 gap-2 p-3 shadow-lg" style={{ left: popover.x, top: popover.y }} data-testid="popover-nova-marcacao">
          <NovaMarcacao onCriar={criar} onCancelar={() => setPopover(null)} />
        </Card>
      )}
    </div>
  );
}

const LARGURA_POPOVER = 288;
const ALTURA_POPOVER = 190;
const MARGEM_POPOVER = 8;

function posicaoDoPopover(trecho: DOMRect) {
  const limitar = (valor: number, maximo: number) => Math.max(MARGEM_POPOVER, Math.min(valor, maximo));
  const cabeAbaixo = trecho.bottom + MARGEM_POPOVER + ALTURA_POPOVER <= window.innerHeight;
  const y = cabeAbaixo ? trecho.bottom + MARGEM_POPOVER : trecho.top - MARGEM_POPOVER - ALTURA_POPOVER;
  return {
    x: limitar(trecho.left, window.innerWidth - LARGURA_POPOVER - MARGEM_POPOVER),
    y: limitar(y, window.innerHeight - ALTURA_POPOVER - MARGEM_POPOVER),
  };
}

function NovaMarcacao({ onCriar, onCancelar }: { onCriar: (t: Tipo, c: Competencia) => void; onCancelar: () => void }) {
  const [c, setC] = React.useState<Competencia>(1);
  return (
    <>
      <div className="text-xs font-semibold text-muted-foreground">Marcar este trecho como</div>
      <div className="flex gap-1.5">
        {(["acerto", "atencao", "erro"] as Tipo[]).map((t) => (
          <Button key={t} size="sm" variant="outline" onClick={() => onCriar(t, c)} data-testid={`nova-marcacao-${t}`}>
            <PontoTipo tipo={t} /> {NOME_TIPO[t]}
          </Button>
        ))}
      </div>
      <NativeSelect value={c} onChange={(e) => setC(Number(e.target.value) as Competencia)} aria-label="Competência" data-testid="nova-marcacao-competencia">
        {COMPETENCIAS.map((x) => <option key={x} value={x}>C{x} · {NOME_COMPETENCIA[x]}</option>)}
      </NativeSelect>
      <Button size="sm" variant="ghost" onClick={onCancelar} data-testid="nova-marcacao-cancelar">Cancelar</Button>
    </>
  );
}

interface CardProps {
  m: Marcacao;
  n: number;
  redacao: Redacao;
  ativa: boolean;
  editando: boolean;
  recusando: boolean;
  bloqueado: boolean;
  onFocar: () => void;
  setEditando: (id: string | null) => void;
  setRecusando: (id: string | null) => void;
}

function CardMarcacao({ m, n, redacao, ativa, editando, recusando, bloqueado, onFocar, setEditando, setRecusando }: CardProps) {
  const { estado, despachar } = useApp();
  const [texto, setTexto] = React.useState(comentarioVisivel(m));
  const [tipo, setTipo] = React.useState<Tipo>(m.tipo);
  const [comp, setComp] = React.useState<Competencia>(m.competencia);
  const [motivo, setMotivo] = React.useState(MOTIVOS[0]);
  const t = taxa(estado.calibragem, m.competencia, m.tipo);
  const auto = m.origem === "automatica";
  const base = { redacaoId: redacao.id, marcacaoId: m.id };

  return (
    <Card
      data-testid={`card-${m.id}`}
      data-status={m.status}
      data-origem={m.origem}
      onClick={(e) => !(e.target as HTMLElement).closest("button,select,textarea") && onFocar()}
      className={cn("grid gap-1.5 border-l-[3px] p-3", bordaTipo(m.tipo), ativa && "ring-2 ring-ring", m.status === "recusada" && "opacity-50")}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <PontoTipo tipo={m.tipo} />
        <span className="font-mono font-semibold">C{m.competencia}</span>
        <span>{NOME_TIPO[m.tipo]} · #{n}</span>
        <span className="ml-auto">
          {auto ? (
            <Badge variant={(m.confianca ?? 1) < 0.7 ? "atencao" : "outline"} data-testid="card-origem">Automática {Math.round((m.confianca ?? 0) * 100)}%</Badge>
          ) : (
            <Badge variant="secondary" data-testid="card-origem">Sua</Badge>
          )}
        </span>
      </div>
      <p className="line-clamp-2 font-serif text-sm italic">“{m.trecho}”</p>

      {editando ? (
        <div className="grid gap-2" data-testid="card-editor">
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Comentário para o aluno" className="min-h-16" data-testid="card-editor-texto" autoFocus />
          <div className="flex flex-wrap gap-1.5">
            <NativeSelect value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} aria-label="Tipo" data-testid="card-editor-tipo" className="h-8">
              {(["acerto", "atencao", "erro"] as Tipo[]).map((x) => <option key={x} value={x}>{NOME_TIPO[x]}</option>)}
            </NativeSelect>
            <NativeSelect value={comp} onChange={(e) => setComp(Number(e.target.value) as Competencia)} aria-label="Competência" data-testid="card-editor-competencia" className="h-8">
              {COMPETENCIAS.map((x) => <option key={x} value={x}>C{x}</option>)}
            </NativeSelect>
            <Button
              size="sm"
              onClick={() => {
                if (auto) despachar({ type: "decidir", ...base, status: "editada", comentario: texto.trim() });
                else despachar({ type: "editar_marcacao", ...base, patch: { comentario: texto.trim() } });
                despachar({ type: "editar_marcacao", ...base, patch: { tipo, competencia: comp } });
                setEditando(null);
              }}
              data-testid="card-editor-salvar"
            >
              Salvar
            </Button>
            {auto ? (
              <Button size="sm" variant="ghost" onClick={() => setEditando(null)} data-testid="card-editor-cancelar">Cancelar</Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => despachar({ type: "excluir_marcacao", ...base })} data-testid="card-excluir"><Trash2 /> Excluir</Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm" data-testid="card-comentario">{comentarioVisivel(m) || "Sem comentário."}</p>
          {m.sugestao && <p className="text-xs text-muted-foreground">Sugestão: {m.sugestao}</p>}
          {m.status === "pre_aprovada" && (
            <p className="text-xs text-primary" data-testid="card-pre-aprovada">Pré-aprovada pela sua calibragem ({Math.round(t.taxa * 100)}% em {t.casos} casos)</p>
          )}
          {m.status === "recusada" && m.motivoRecusa && <p className="text-xs text-muted-foreground">Recusada: {m.motivoRecusa}</p>}
        </>
      )}

      {recusando && !editando && (
        <div className="flex flex-wrap gap-1.5" data-testid="card-recusa">
          <NativeSelect value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo da recusa" data-testid="card-recusa-motivo" className="h-8">
            {MOTIVOS.map((x) => <option key={x}>{x}</option>)}
          </NativeSelect>
          <Button size="sm" variant="destructive" onClick={() => { despachar({ type: "decidir", ...base, status: "recusada", motivo }); setRecusando(null); }} data-testid="card-recusa-confirmar">Recusar</Button>
          <Button size="sm" variant="ghost" onClick={() => setRecusando(null)} data-testid="card-recusa-cancelar">Cancelar</Button>
        </div>
      )}

      {!editando && !recusando && !bloqueado && (
        <div className="flex flex-wrap items-center gap-1">
          {auto && (
            <>
              <Button size="sm" variant={m.status === "aprovada" || m.status === "pre_aprovada" ? "default" : "outline"} onClick={() => despachar({ type: "decidir", ...base, status: "aprovada" })} data-testid="card-aprovar">
                <Check /> Aprovar
              </Button>
              <Button size="sm" variant={m.status === "recusada" ? "destructive" : "outline"} onClick={() => setRecusando(m.id)} data-testid="card-recusar">
                <X /> Recusar
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => { setTexto(comentarioVisivel(m)); setEditando(m.id); }} data-testid="card-editar"><Pencil /> Editar</Button>
          {auto && m.status !== "pendente" && m.status !== "pre_aprovada" && (
            <Button size="sm" variant="ghost" onClick={() => despachar({ type: "desfazer", ...base })} data-testid="card-desfazer"><Undo2 /> Desfazer</Button>
          )}
        </div>
      )}
    </Card>
  );
}
