import * as React from "react";
import { AlertTriangle, Check, Eye, ImageIcon, MessageSquareWarning, Pencil, RotateCcw, Send, Trash2, Undo2, X, ZoomIn, ZoomOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Kbd } from "@/components/ui/misc";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useApp } from "@/store/app-store";
import { navegar } from "@/lib/router";
import { PROFESSORES, PROPOSTA, USUARIO_PROFESSOR } from "@/domain/seed";
import type { Competencia, Marcacao, Redacao, Tipo } from "@/domain/types";
import { COMPETENCIAS, NOME_COMPETENCIA, NOME_TIPO, NOTAS_VALIDAS } from "@/domain/types";
import {
  TEXTO_ALERTA, comentarioVisivel, expandirParaPalavras, notaAlteradaPeloProfessor, notaFinal, notaTotal, pedidosAbertos,
  pendentes, podeDevolver, prioridade, taxa, visivelParaAluno, zeroAguardandoDecisao, zeroAtivo,
} from "@/domain/regras";
import { EssayDocument, LegendaTipos, PontoTipo, bordaTipo, selecaoParaOffsets } from "@/features/redacao/essay-document";
import { Devolutiva } from "@/features/devolutiva/devolutiva";
import { cn, dataHora } from "@/lib/utils";

type FiltroCards = "pendentes" | "todas" | "professor";
const MOTIVOS = ["Não procede", "Competência errada", "Tipo errado", "Comentário impreciso"];
const NOME_PROFESSOR = `Prof. ${PROFESSORES.find((p) => p.id === USUARIO_PROFESSOR)!.nome}`;

const estaDigitando = (alvo: EventTarget | null) => alvo instanceof HTMLElement && !!alvo.closest("input, textarea, select, [contenteditable]");

export function Revisao({ redacao }: { redacao: Redacao }) {
  const { estado, despachar } = useApp();
  const [filtro, setFiltro] = React.useState<FiltroCards>(pendentes(redacao).length ? "pendentes" : "todas");
  const [ativa, setAtiva] = React.useState<string | null>(null);
  const [editando, setEditando] = React.useState<string | null>(null);
  const [recusando, setRecusando] = React.useState<string | null>(null);
  const [popover, setPopover] = React.useState<{ x: number; y: number; inicio: number; fim: number; conflito: boolean } | null>(null);
  const [verFoto, setVerFoto] = React.useState(false);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const [previa, setPrevia] = React.useState(false);
  const [confirmando, setConfirmando] = React.useState(false);
  const docRef = React.useRef<HTMLDivElement>(null);
  const devolvida = redacao.etapa === "devolvida";

  const numeracao = Object.fromEntries(redacao.marcacoes.map((m, i) => [m.id, i + 1]));
  let cards = redacao.marcacoes;
  if (filtro === "pendentes") cards = cards.filter((m) => m.origem === "automatica" && m.status === "pendente").sort((a, b) => (a.confianca ?? 1) - (b.confianca ?? 1));
  if (filtro === "professor") cards = cards.filter((m) => m.origem === "professor");
  const nPend = pendentes(redacao).length;
  const liberada = podeDevolver(redacao);

  const focar = (id: string) => {
    const m = redacao.marcacoes.find((x) => x.id === id);
    if (m && ((filtro === "pendentes" && m.status !== "pendente") || (filtro === "professor" && m.origem !== "professor"))) setFiltro("todas");
    setAtiva(id);
    requestAnimationFrame(() => document.querySelector(`[data-testid="card-${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  React.useEffect(() => {
    if (devolvida) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (estaDigitando(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const tecla = e.key.toLowerCase();
      if (previa) {
        if (tecla === "p" || tecla === "escape") { setPrevia(false); e.preventDefault(); }
        return;
      }
      const idx = cards.findIndex((m) => m.id === ativa);
      const atual = cards[idx];
      if (tecla === "j" || tecla === "k") {
        const prox = cards[tecla === "j" ? Math.min(cards.length - 1, idx + 1) : Math.max(0, idx - 1)];
        if (prox) focar(prox.id);
      } else if (atual && tecla === "a" && atual.origem === "automatica") {
        despachar({ type: "decidir", redacaoId: redacao.id, marcacaoId: atual.id, status: "aprovada" });
        const prox = cards.find((m, i) => i > idx && m.status === "pendente");
        if (prox) focar(prox.id);
      } else if (atual && tecla === "r" && atual.origem === "automatica") {
        setRecusando(atual.id);
      } else if (atual && tecla === "e") {
        setEditando(atual.id);
      } else if (tecla === "p") {
        setPrevia(true);
      } else if (tecla === "d" && liberada) {
        setConfirmando(true);
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  const onMouseUp = () => {
    if (devolvida || !docRef.current) return;
    const off = selecaoParaOffsets(docRef.current);
    if (!off) return setPopover(null);
    const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
    const { inicio, fim } = expandirParaPalavras(redacao.texto, off.inicio, off.fim);
    const conflito = redacao.marcacoes.some((m) => inicio < m.fim && fim > m.inicio);
    setPopover({ ...posicaoDoPopover(rect), ...off, conflito });
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

  const proxima = estado.redacoes
    .filter((r) => r.id !== redacao.id && r.etapa !== "devolvida")
    .sort((a, b) => prioridade(b) - prioridade(a))[0];
  const motivoBloqueio = devolvida
    ? `Devolvida ${redacao.devolvidaEm ? `em ${dataHora(redacao.devolvidaEm)} ` : ""}com a assinatura de ${NOME_PROFESSOR}`
    : zeroAguardandoDecisao(redacao)
      ? "Decida o zero sugerido antes de devolver"
      : nPend
        ? `${nPend} aguardando você`
        : "Tudo revisado";

  return (
    <div data-testid="revisao" data-previa={previa}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <LegendaTipos />
        <div className="flex flex-wrap items-center gap-1.5" data-testid="revisao-notas">
          {COMPETENCIAS.map((c) => (
            <label key={c} title={NOME_COMPETENCIA[c]} className="flex items-center gap-1 rounded-lg border bg-card pl-2">
              <span className="font-mono text-[11px] font-semibold text-muted-foreground">C{c}</span>
              <NativeSelect
                className="h-8 border-0 bg-transparent font-mono"
                value={notaFinal(redacao, c)}
                disabled={devolvida || zeroAtivo(redacao)}
                onChange={(e) => despachar({ type: "definir_nota", redacaoId: redacao.id, competencia: c, nota: Number(e.target.value) })}
                data-testid={`nota-c${c}`}
                aria-label={`Nota C${c}`}
              >
                {NOTAS_VALIDAS.map((n) => <option key={n} value={n}>{n}</option>)}
              </NativeSelect>
            </label>
          ))}
          <span className="ml-1 flex items-baseline gap-1.5 rounded-lg bg-secondary px-3 py-1 text-secondary-foreground">
            <span className="text-[11px] font-semibold">Total</span>
            <span className="font-mono text-lg font-bold" data-testid="nota-total">{notaTotal(redacao)}</span>
          </span>
        </div>
      </div>

      <div className="mb-4 grid gap-3">
        {redacao.motivoZero && <PainelZero redacao={redacao} bloqueado={devolvida} />}
        <Alertas redacao={redacao} />
        <PedidosRevisao redacao={redacao} />
      </div>

      {previa ? (
        <div className="grid gap-3" data-testid="revisao-previa-conteudo">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary bg-secondary/60 px-4 py-2.5 text-sm">
            <span><b>Prévia:</b> é isto que o aluno vai receber ao devolver.</span>
            <Button size="sm" variant="outline" onClick={() => setPrevia(false)} data-testid="revisao-previa-fechar">Voltar à revisão</Button>
          </div>
          <Devolutiva redacao={redacao} previa />
        </div>
      ) : (
        <div className={cn("grid gap-6", verFoto ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,1fr)_340px]")}>
          <div className="grid content-start gap-4">
            <BotaoFoto redacao={redacao} ver={verFoto} onAlternar={() => setVerFoto(!verFoto)} />
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
            <NotasDetalhadas redacao={redacao} bloqueado={devolvida} />
            <Recado redacao={redacao} bloqueado={devolvida} />
          </div>

          {verFoto ? (
            <PainelFotos imagens={redacao.imagens ?? []} onFechar={() => setVerFoto(false)} />
          ) : (
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
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
            <p className="mb-2 text-[11px] text-muted-foreground" data-testid="revisao-legenda-certeza">
              “Certeza” é o quanto a correção automática confia na própria sugestão. As de menor certeza aparecem primeiro.
            </p>
            <div className="grid max-h-[calc(100vh-320px)] gap-2 overflow-auto p-0.5" data-testid="revisao-cards">
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
            {!devolvida && (
              <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground" data-testid="revisao-atalhos">
                Atalhos: <Kbd>J</Kbd>/<Kbd>K</Kbd> próxima/anterior · <Kbd>A</Kbd> aprovar · <Kbd>R</Kbd> recusar · <Kbd>E</Kbd> editar · <Kbd>P</Kbd> prévia · <Kbd>D</Kbd> devolver
              </p>
            )}

            <div className="mt-3 grid gap-2 rounded-lg border bg-card p-3" data-testid="revisao-rodape">
              <span className="text-xs text-muted-foreground" data-testid="revisao-resumo">{aviso ?? motivoBloqueio}</span>
              {confirmando && liberada ? (
                <div className="grid gap-2" data-testid="revisao-confirmacao">
                  <p className="text-sm">
                    O aluno vai receber nota <b>{notaTotal(redacao)}</b> e {redacao.marcacoes.filter(visivelParaAluno).length} comentários, assinados por <b>{NOME_PROFESSOR}</b>.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" onClick={() => { despachar({ type: "devolver", redacaoId: redacao.id }); setConfirmando(false); }} data-testid="revisao-devolver-confirmar">
                      <Send /> Confirmar devolução
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmando(false)} data-testid="revisao-devolver-cancelar">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setPrevia(true)} data-testid="revisao-previa">
                    <Eye /> Ver como o aluno recebe
                  </Button>
                  {devolvida ? (
                    pedidosAbertos(redacao).length > 0 ? (
                      <Button size="sm" onClick={() => despachar({ type: "reabrir", redacaoId: redacao.id })} data-testid="revisao-reabrir">
                        <RotateCcw /> Reabrir para revisão
                      </Button>
                    ) : (
                      proxima && <Button size="sm" onClick={() => navegar(`/redacoes/${proxima.id}?visao=professor`)} data-testid="revisao-proxima">Próxima redação</Button>
                    )
                  ) : (
                    <Button size="sm" onClick={() => setConfirmando(true)} disabled={!liberada} data-testid="revisao-devolver">
                      <Send /> Devolver ao aluno
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>
          )}
        </div>
      )}

      {popover && (
        <Card className="fixed z-50 grid w-72 gap-2 p-3 shadow-lg" style={{ left: popover.x, top: popover.y }} data-testid="popover-nova-marcacao">
          {popover.conflito ? (
            <div className="grid gap-2 text-sm" data-testid="popover-conflito">
              <p>Esse trecho já tem uma marcação. Para comentar nele, edite a marcação existente; para criar outra, selecione só texto sem cor.</p>
              <Button size="sm" variant="ghost" onClick={() => setPopover(null)}>Entendi</Button>
            </div>
          ) : (
            <NovaMarcacao onCriar={criar} onCancelar={() => setPopover(null)} />
          )}
        </Card>
      )}
    </div>
  );
}

function PainelZero({ redacao, bloqueado }: { redacao: Redacao; bloqueado: boolean }) {
  const { despachar } = useApp();
  const situacao = redacao.situacaoZero ?? "sugerido";
  const [justificativa, setJustificativa] = React.useState(redacao.justificativaZero ?? "");
  const decidir = (s: "confirmado" | "anulado") => despachar({ type: "decidir_zero", redacaoId: redacao.id, situacao: s, justificativa: justificativa.trim() || undefined });
  return (
    <Card className={cn("grid gap-2 border-erro p-4", situacao === "anulado" && "border-border")} data-testid="revisao-zero" data-situacao={situacao}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={situacao === "anulado" ? "outline" : "erro"}>
          {situacao === "sugerido" ? "Zero sugerido" : situacao === "confirmado" ? "Zero confirmado por você" : "Zero anulado por você"}
        </Badge>
        <span className="text-sm font-semibold" data-testid="revisao-zero-motivo">{redacao.motivoZero}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {situacao === "anulado"
          ? "A redação segue para a avaliação normal: as notas por competência voltam a valer e podem ser ajustadas."
          : "Enquanto o zero valer, todas as competências ficam com 0. Confira a foto original antes de decidir."}
      </p>
      {!bloqueado && (
        <>
          <Textarea
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            onBlur={() => despachar({ type: "definir_mensagem_zero", redacaoId: redacao.id, mensagem: justificativa.trim() })}
            placeholder="Mensagem para o aluno sobre essa decisão (opcional). Ex.: o que fazer para não zerar na próxima."
            className="min-h-14"
            aria-label="Mensagem sobre o zero"
            data-testid="revisao-zero-justificativa"
          />
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant={situacao === "confirmado" ? "destructive" : "outline"} onClick={() => decidir("confirmado")} data-testid="revisao-zero-confirmar">Confirmar zero</Button>
            <Button size="sm" variant={situacao === "anulado" ? "default" : "outline"} onClick={() => decidir("anulado")} data-testid="revisao-zero-anular">Anular zero e avaliar normalmente</Button>
          </div>
        </>
      )}
    </Card>
  );
}

function Alertas({ redacao }: { redacao: Redacao }) {
  const { estado } = useApp();
  const alertas = redacao.alertas ?? [];
  const outra = estado.redacoes.find((r) => r.id === redacao.repeteRedacaoId);
  if (!alertas.length) return null;
  return (
    <Card className="grid gap-1.5 border-atencao bg-atencao-bg/40 p-4 text-sm" data-testid="revisao-alertas">
      <h3 className="flex items-center gap-2 font-bold"><AlertTriangle className="size-4" /> Confira antes de corrigir</h3>
      <ul className="grid list-disc gap-1 pl-5">
        {alertas.map((a) => (
          <li key={a} data-testid={`revisao-alerta-${a}`}>
            {TEXTO_ALERTA[a].professor}
            {a === "texto_repetido" && redacao.repeteRedacaoId && (
              <> <a href={`#/redacoes/${redacao.repeteRedacaoId}?visao=professor`} className="font-semibold text-primary underline underline-offset-2" data-testid="revisao-abrir-repetida">Abrir a outra redação</a></>
            )}
            {a === "texto_repetido" && outra && <ComparacaoRepetida estaRedacao={redacao} outra={outra} />}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PedidosRevisao({ redacao }: { redacao: Redacao }) {
  const pedidos = redacao.pedidosRevisao ?? [];
  if (!pedidos.length) return null;
  return (
    <Card className="grid gap-2 border-primary p-4 text-sm" data-testid="revisao-pedidos">
      <h3 className="flex items-center gap-2 font-bold"><MessageSquareWarning className="size-4" /> O aluno pediu revisão</h3>
      {pedidos.map((p) => (
        <div key={p.id} className="grid gap-0.5" data-testid={`revisao-pedido-${p.id}`} data-atendido={p.atendido}>
          <span className="text-xs text-muted-foreground">
            {p.competencia ? `C${p.competencia} · ${NOME_COMPETENCIA[p.competencia]}` : "Nota zero"} · {dataHora(p.criadoEm)}{p.atendido ? " · reaberta" : ""}
          </span>
          <p>“{p.mensagem}”</p>
        </div>
      ))}
    </Card>
  );
}

function BotaoFoto({ redacao, ver, onAlternar }: { redacao: Redacao; ver: boolean; onAlternar: () => void }) {
  const imagens = redacao.imagens ?? [];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="revisao-foto">
      {imagens.length ? (
        <Button size="sm" variant="outline" onClick={onAlternar} aria-expanded={ver} data-testid="revisao-ver-foto">
          <ImageIcon /> {ver ? "Fechar foto e voltar às correções" : `Ver foto original ao lado do texto (${imagens.length} ${imagens.length > 1 ? "folhas" : "folha"})`}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground" data-testid="revisao-sem-foto">Sem foto: o aluno enviou o texto digitado ou a folha de exemplo.</span>
      )}
    </div>
  );
}

function PainelFotos({ imagens, onFechar }: { imagens: string[]; onFechar: () => void }) {
  const [ampliada, setAmpliada] = React.useState(false);
  return (
    <aside className="grid content-start gap-2 lg:sticky lg:top-20 lg:self-start" data-testid="revisao-fotos" data-ampliada={ampliada}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => setAmpliada(!ampliada)} data-testid="revisao-foto-zoom">
          {ampliada ? <ZoomOut /> : <ZoomIn />} {ampliada ? "Reduzir" : "Ampliar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onFechar}>Voltar às correções</Button>
      </div>
      <div className="grid max-h-[calc(100vh-140px)] gap-3 overflow-auto rounded-lg border bg-muted/40 p-2">
        {imagens.map((u, i) => (
          <img
            key={u}
            src={u}
            alt={`Folha ${i + 1} enviada pelo aluno`}
            onClick={() => setAmpliada(!ampliada)}
            className={cn("cursor-zoom-in rounded-md border", ampliada ? "w-[200%] max-w-none cursor-zoom-out" : "w-full")}
          />
        ))}
      </div>
    </aside>
  );
}

function ComparacaoRepetida({ estaRedacao, outra }: { estaRedacao: Redacao; outra: Redacao }) {
  const diferentes = COMPETENCIAS.filter((c) => notaFinal(estaRedacao, c) !== notaFinal(outra, c));
  return (
    <div className="mt-1 rounded-md bg-card px-3 py-2 text-xs" data-testid="revisao-comparacao-repetida" data-diferentes={diferentes.length}>
      Outra redação ({outra.etapa === "devolvida" ? "já devolvida" : "em aberto"}): <b>{notaTotal(outra)}</b> · esta: <b>{notaTotal(estaRedacao)}</b>.{" "}
      {diferentes.length
        ? `Diferem em ${diferentes.map((c) => `C${c} (${notaFinal(outra, c)} × ${notaFinal(estaRedacao, c)})`).join(", ")}. Mesmo texto deve ter a mesma nota.`
        : "Notas iguais por competência."}
    </div>
  );
}

function NotasDetalhadas({ redacao, bloqueado }: { redacao: Redacao; bloqueado: boolean }) {
  const { despachar } = useApp();
  return (
    <Card className="grid gap-3 p-4" data-testid="revisao-notas-detalhe">
      <div>
        <h3 className="text-sm font-bold">Notas por competência</h3>
        <p className="text-xs text-muted-foreground">Sugestão automática com a justificativa. Se mudar a nota, explique ao aluno: ele vê só a sua nota e a sua explicação.</p>
      </div>
      {COMPETENCIAS.map((c) => {
        const a = redacao.avaliacaoAutomatica[c];
        const alterada = notaAlteradaPeloProfessor(redacao, c);
        return (
          <div key={c} className="grid gap-1 border-t pt-2 text-sm" data-testid={`revisao-nota-detalhe-c${c}`} data-alterada={alterada}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-xs font-semibold">C{c}</span>
              <span className="font-semibold">{NOME_COMPETENCIA[c]}</span>
              <span className="ml-auto font-mono">{notaFinal(redacao, c)}</span>
            </div>
            <p className="text-muted-foreground">
              <span className="text-xs font-semibold">Sugestão automática: {a.nota}.</span> {a.justificativa}
            </p>
            {alterada && (
              <div className="grid gap-1">
                <span className="text-xs font-semibold text-primary" data-testid={`revisao-nota-alterada-c${c}`}>Você mudou de {a.nota} para {notaFinal(redacao, c)}.</span>
                <Textarea
                  defaultValue={redacao.justificativasProfessor?.[c] ?? ""}
                  onBlur={(e) => despachar({ type: "justificar_nota", redacaoId: redacao.id, competencia: c, justificativa: e.target.value.trim() })}
                  disabled={bloqueado}
                  placeholder="Por que esta nota? O aluno vai ler esta explicação."
                  className="min-h-14"
                  aria-label={`Justificativa da nota C${c}`}
                  data-testid={`revisao-justificativa-c${c}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

function Recado({ redacao, bloqueado }: { redacao: Redacao; bloqueado: boolean }) {
  const { despachar } = useApp();
  return (
    <Card className="grid gap-2 p-4" data-testid="revisao-recado">
      <label htmlFor="recado" className="text-sm font-bold">Recado para o aluno</label>
      <Textarea
        id="recado"
        defaultValue={redacao.recadoProfessor ?? ""}
        onBlur={(e) => despachar({ type: "definir_recado", redacaoId: redacao.id, recado: e.target.value.trim() })}
        disabled={bloqueado}
        placeholder="Um incentivo ou orientação geral, que aparece no topo da devolutiva com a sua assinatura (opcional)."
        className="min-h-16"
        data-testid="revisao-recado-texto"
      />
    </Card>
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

  React.useEffect(() => {
    if (editando) setTexto(comentarioVisivel(m));
  }, [editando]);

  return (
    <Card
      data-testid={`card-${m.id}`}
      data-status={m.status}
      data-origem={m.origem}
      data-ativa={ativa}
      onClick={(e) => !(e.target as HTMLElement).closest("button,select,textarea") && onFocar()}
      className={cn("grid gap-1.5 border-l-[3px] p-3", bordaTipo(m.tipo), ativa && "ring-2 ring-ring", m.status === "recusada" && "opacity-50")}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <PontoTipo tipo={m.tipo} />
        <span className="font-mono font-semibold" title={NOME_COMPETENCIA[m.competencia]}>C{m.competencia}</span>
        <span>{NOME_TIPO[m.tipo]} · #{n}</span>
        <span className="ml-auto">
          {!auto ? (
            <Badge variant="secondary" data-testid="card-origem">Sua</Badge>
          ) : m.status === "editada" ? (
            <Badge variant="secondary" data-testid="card-origem">Editada por você</Badge>
          ) : (
            <Badge variant={(m.confianca ?? 1) < 0.7 ? "atencao" : "outline"} title="Quanto a correção automática tem certeza desta marcação" data-testid="card-origem">
              Sugestão · certeza {Math.round((m.confianca ?? 0) * 100)}%
            </Badge>
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
            <p className="text-xs text-primary" data-testid="card-pre-aprovada">
              Pré-aprovada: você concordou com {Math.round(t.taxa * 100)}% das sugestões deste tipo em {t.casos} casos. Recuse se discordar.
            </p>
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
          <Button size="sm" variant="ghost" onClick={() => setEditando(m.id)} data-testid="card-editar"><Pencil /> Editar</Button>
          {auto && m.status !== "pendente" && m.status !== "pre_aprovada" && (
            <Button size="sm" variant="ghost" onClick={() => despachar({ type: "desfazer", ...base })} data-testid="card-desfazer"><Undo2 /> Desfazer</Button>
          )}
        </div>
      )}
    </Card>
  );
}
