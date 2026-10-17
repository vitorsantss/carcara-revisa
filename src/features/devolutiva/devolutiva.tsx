import * as React from "react";
import { MessageSquare, PenLine, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useApp } from "@/store/app-store";
import { PROFESSORES, PROPOSTA, USUARIO_PROFESSOR } from "@/domain/seed";
import type { Competencia, Redacao, Tipo } from "@/domain/types";
import { COMPETENCIAS, EXPLICACAO_COMPETENCIA, NOME_COMPETENCIA, NOME_TIPO } from "@/domain/types";
import { GlossarioCompetencias } from "@/features/redacao/glossario";
import {
  ROTULO_AUTORIA, autoria, comentarioVisivel, comoEvitarZero, historicoAte, notaAlteradaPeloProfessor, notaFinal, notaTotal, versaoAnterior, visivelParaAluno, zeroAtivo,
} from "@/domain/regras";
import { EssayDocument, PontoTipo, bordaTipo } from "@/features/redacao/essay-document";
import { cn, dataCurta, dataHora } from "@/lib/utils";
import { imprimir } from "@/lib/impressao";
import { RadarCard } from "./radar-card";
import { RelatorioDaVersao } from "./relatorio-da-versao";
import { StoriesDialog } from "@/features/stories/stories-dialog";

const TIPOS: Tipo[] = ["acerto", "atencao", "erro"];

/**
 * Devolutiva do aluno: folha marcada + comentários na margem, alinhados ao trecho
 * (estilo comentários do Notion). O filtro por cor também vale para a exportação.
 * Com `previa`, o professor vê exatamente isto antes de devolver, sem as ações do aluno.
 */
export function Devolutiva({ redacao, previa = false }: { redacao: Redacao; previa?: boolean }) {
  const { estado } = useApp();
  const [filtro, setFiltro] = React.useState<string[]>(TIPOS);
  const [ativa, setAtiva] = React.useState<string | null>(null);
  const docRef = React.useRef<HTMLDivElement>(null);
  const margemRef = React.useRef<HTMLDivElement>(null);

  const visiveis = redacao.marcacoes.filter(visivelParaAluno);
  const filtradas = visiveis.filter((m) => filtro.includes(m.tipo));
  const numeracao = Object.fromEntries(filtradas.map((m, i) => [m.id, i + 1]));
  const contar = (t: Tipo) => visiveis.filter((m) => m.tipo === t).length;
  const professor = PROFESSORES.find((p) => p.id === (redacao.revisorId ?? USUARIO_PROFESSOR))!;
  const zero = zeroAtivo(redacao);
  const anterior = versaoAnterior(estado.redacoes, redacao);
  const historico = historicoAte(estado.redacoes, redacao);
  const [compartilhando, setCompartilhando] = React.useState(false);

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
    <div data-testid="devolutiva" data-previa={previa}>
      <div data-print="tela">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-5xl font-extrabold leading-none tracking-tight tabular-nums" data-testid="devolutiva-nota-total">
            {notaTotal(redacao)} <span className="text-lg font-semibold tracking-normal text-muted-foreground">/ 1000</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm" data-testid="devolutiva-assinatura">
            <PenLine className="size-4 text-primary" />
            Corrigida e assinada por <b>Prof. {professor.nome}</b>
            {redacao.devolvidaEm && <span className="text-muted-foreground">em {dataCurta(redacao.devolvidaEm)}</span>}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" data-testid="devolutiva-notas">
            {COMPETENCIAS.map((c) => (
              <span key={c} className="rounded-md border bg-card px-2 py-0.5 text-xs" data-testid={`devolutiva-nota-c${c}`}>
                <b className="mr-1 font-mono text-muted-foreground">C{c}</b>
                <span className="mr-1.5 text-muted-foreground">{NOME_COMPETENCIA[c]}</span>
                <b className="font-mono">{notaFinal(redacao, c)}</b>
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
          {!previa && (
            <Button variant="outline" onClick={() => imprimir("folha")} data-testid="devolutiva-exportar">
              <Printer /> Imprimir folha
            </Button>
          )}
        </div>
      </div>

      {!zero && (
        <RadarCard
          redacao={redacao}
          anterior={anterior}
          previa={previa}
          acoes={
            <Button size="sm" onClick={() => setCompartilhando(true)} data-testid="devolutiva-compartilhar">
              <Share2 /> Compartilhar
            </Button>
          }
        />
      )}

      <div className="mb-5 grid gap-3">
        {zero && (
          <Card className="grid gap-1.5 border-erro p-4 text-sm" data-testid="devolutiva-zero">
            <h3 className="font-bold">Por que a nota foi zero</h3>
            <p data-testid="devolutiva-zero-motivo">{redacao.motivoZero}</p>
            {redacao.justificativaZero && <p className="italic">“{redacao.justificativaZero}” <span className="not-italic text-muted-foreground">— Prof. {professor.nome}</span></p>}
            <p data-testid="devolutiva-zero-como-evitar"><b>Como evitar na próxima:</b> {comoEvitarZero(redacao.motivoZero ?? "")}</p>
            {visiveis.length > 0 && (
              <p className="text-xs text-muted-foreground">Os comentários na folha mostram o que você já faz bem e o que melhorar. Eles ajudam na próxima redação, mas não mudam esta nota.</p>
            )}
          </Card>
        )}
        {redacao.recadoProfessor && (
          <Card className="grid gap-1 border-primary p-4 text-sm" data-testid="devolutiva-recado">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary"><MessageSquare className="size-3.5" /> Recado do Prof. {professor.nome}</span>
            <p>{redacao.recadoProfessor}</p>
          </Card>
        )}
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
              data-autoria={autoria(m)}
              data-active={ativa === m.id}
              onClick={() => setAtiva(m.id)}
              className={cn("left-0 right-0 grid cursor-pointer gap-1 border-l-[3px] p-3 transition-[top] lg:absolute", bordaTipo(m.tipo), ativa === m.id && "ring-2 ring-ring")}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <PontoTipo tipo={m.tipo} />
                <span className="font-mono font-semibold">C{m.competencia}</span>
                <span>{NOME_COMPETENCIA[m.competencia]}</span>
                <span>· {NOME_TIPO[m.tipo]} · #{numeracao[m.id]}</span>
              </div>
              <p className="text-sm">{comentarioVisivel(m)}</p>
              {m.sugestao && <p className="text-xs text-muted-foreground">Sugestão: {m.sugestao}</p>}
              <span className="text-[11px] text-muted-foreground" data-testid="comentario-autor">{ROTULO_AUTORIA[autoria(m)]}</span>
            </Card>
          ))}
        </div>
      </div>

      {zero ? (
        <Card className="mt-6 grid gap-2 p-5 text-sm" data-testid="devolutiva-proxima">
          <h3 className="font-bold">Não concorda com o zero?</h3>
          <p className="text-muted-foreground">Se a foto cortou uma parte ou o motivo não se aplica ao que você escreveu, peça ao professor para revisar.</p>
          {!previa && redacao.etapa === "devolvida" && <PedidoRevisao redacao={redacao} />}
        </Card>
      ) : (
        <Competencias redacao={redacao} previa={previa} />
      )}

      {!zero && (
      <Card className="mt-6 p-5" data-testid="devolutiva-missoes">
        <h3 className="mb-2 text-sm font-bold">Para a reescrita</h3>
        <ol className="grid list-decimal gap-1.5 pl-5 text-sm">
          {passos.map((p) => (
            <li key={p.c} data-testid={`missao-c${p.c}`}>
              <span className="mr-1 font-mono text-xs font-semibold text-muted-foreground">C{p.c}</span>
              <span className="mr-1 text-xs text-muted-foreground">{NOME_COMPETENCIA[p.c]}:</span>
              {p.passo}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Na próxima versão, cada trecho marcado é conferido de novo.</p>
      </Card>
      )}

      <GlossarioCompetencias className="mt-4" testId="devolutiva-glossario" />
      </div>

      {!zero && !previa && (
        <RelatorioDaVersao
          data-testid="radar-resumo-impressao"
          titulo={`Minha redação · ${PROPOSTA.temaCurto}`}
          subtitulo={`Versão ${redacao.versao} · corrigida pelo Prof. ${professor.nome}${redacao.devolvidaEm ? ` em ${dataCurta(redacao.devolvidaEm)}` : ""}`}
          redacao={redacao}
          anterior={anterior}
          historico={historico}
        />
      )}
      {!zero && !previa && (
        <StoriesDialog open={compartilhando} onOpenChange={setCompartilhando} redacao={redacao} historico={historico} proposta={PROPOSTA} />
      )}
    </div>
  );
}

function Competencias({ redacao, previa }: { redacao: Redacao; previa: boolean }) {
  const zero = zeroAtivo(redacao);
  return (
    <Card className="mt-6 grid gap-3 p-5" data-testid="devolutiva-competencias">
      <div>
        <h3 className="text-sm font-bold">Sua nota, competência por competência</h3>
        <p className="text-xs text-muted-foreground">Cada competência vale de 0 a 200. Toque em “O que são as 5 competências?” no fim da página para entender cada uma.</p>
      </div>
      {COMPETENCIAS.map((c) => (
        <LinhaCompetencia key={c} redacao={redacao} c={c} zero={zero} previa={previa} />
      ))}
    </Card>
  );
}

function LinhaCompetencia({ redacao, c, zero, previa }: { redacao: Redacao; c: Competencia; zero: boolean; previa: boolean }) {
  const { despachar } = useApp();
  const [pedindo, setPedindo] = React.useState(false);
  const [mensagem, setMensagem] = React.useState("");
  const nota = notaFinal(redacao, c);
  const avaliacao = redacao.avaliacaoAutomatica[c];
  const alterada = notaAlteradaPeloProfessor(redacao, c);
  const justificativa = zero ? "A nota zero vale para todas as competências." : (alterada && redacao.justificativasProfessor?.[c]) || avaliacao.justificativa;
  const pedido = (redacao.pedidosRevisao ?? []).find((p) => p.competencia === c);

  return (
    <div className="grid gap-1 border-t pt-3 text-sm" data-testid={`devolutiva-competencia-c${c}`}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-xs font-semibold text-muted-foreground">C{c}</span>
        <span className="font-semibold">{NOME_COMPETENCIA[c]}</span>
        <span className="ml-auto font-mono font-bold">{nota} <span className="font-normal text-muted-foreground">/ 200</span></span>
      </div>
      <p className="text-xs text-muted-foreground">{EXPLICACAO_COMPETENCIA[c]}</p>
      <p data-testid={`devolutiva-justificativa-c${c}`}>
        <b>Por que {nota}:</b> {justificativa}
        {alterada && <> <span className="text-xs text-primary">(nota definida pelo professor)</span></>}
      </p>
      {nota < 200 && !zero && (
        <p data-testid={`devolutiva-proximo-nivel-c${c}`}><b>Para chegar a {nota + 40}:</b> {avaliacao.proximoPasso}</p>
      )}
      {!previa && redacao.etapa === "devolvida" && (
        pedido ? (
          <p className="text-xs text-primary" data-testid={`devolutiva-pedido-confirmacao-c${c}`}>
            {pedido.atendido ? "Seu professor reabriu a correção para revisar." : `Pedido de revisão enviado em ${dataHora(pedido.criadoEm)}. Seu professor vai responder por aqui.`}
          </p>
        ) : pedindo ? (
          <div className="grid gap-1.5" data-testid={`devolutiva-pedido-c${c}`}>
            <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Explique com o que você não concorda, citando o trecho se puder." className="min-h-16" aria-label={`Pedido de revisão da C${c}`} data-testid={`devolutiva-pedido-texto-c${c}`} />
            <div className="flex gap-1.5">
              <Button size="sm" disabled={mensagem.trim().length < 10} onClick={() => despachar({ type: "pedir_revisao", redacaoId: redacao.id, competencia: c, mensagem: mensagem.trim() })} data-testid={`devolutiva-pedido-enviar-c${c}`}>Enviar ao professor</Button>
              <Button size="sm" variant="ghost" onClick={() => setPedindo(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="link" className="h-auto justify-self-start px-0 text-xs" onClick={() => setPedindo(true)} data-testid={`devolutiva-pedir-c${c}`} data-print="hide">
            Não concordo: pedir revisão desta nota
          </Button>
        )
      )}
    </div>
  );
}

function PedidoRevisao({ redacao }: { redacao: Redacao }) {
  const { despachar } = useApp();
  const [pedindo, setPedindo] = React.useState(false);
  const [mensagem, setMensagem] = React.useState("");
  const pedido = (redacao.pedidosRevisao ?? []).find((p) => !p.competencia);
  if (pedido) {
    return (
      <p className="text-xs text-primary" data-testid="devolutiva-pedido-confirmacao-zero">
        {pedido.atendido ? "Seu professor reabriu a correção para revisar." : `Pedido de revisão enviado em ${dataHora(pedido.criadoEm)}. Seu professor vai responder por aqui.`}
      </p>
    );
  }
  if (!pedindo) {
    return (
      <Button size="sm" variant="link" className="justify-self-start px-0 text-xs" onClick={() => setPedindo(true)} data-testid="devolutiva-pedir-zero" data-print="hide">
        Escrevi o texto inteiro e acho que o zero está errado: pedir revisão
      </Button>
    );
  }
  return (
    <div className="grid gap-1.5" data-testid="devolutiva-pedido-zero">
      <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Explique por que você acha que o zero não procede (por exemplo: a foto cortou uma parte)." className="min-h-16" aria-label="Pedido de revisão do zero" data-testid="devolutiva-pedido-texto-zero" />
      <div className="flex gap-1.5">
        <Button size="sm" disabled={mensagem.trim().length < 10} onClick={() => despachar({ type: "pedir_revisao", redacaoId: redacao.id, mensagem: mensagem.trim() })} data-testid="devolutiva-pedido-enviar-zero">Enviar ao professor</Button>
        <Button size="sm" variant="ghost" onClick={() => setPedindo(false)}>Cancelar</Button>
      </div>
    </div>
  );
}
