import * as React from "react";
import { ChevronRight, Download, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useApp } from "@/store/app-store";
import { ALUNOS, DEVOLVIDAS_ANTERIORES, PROPOSTA, TURMAS, USUARIO_ALUNO } from "@/domain/seed";
import {
  confiancaMedia, dataPrevistaDevolutiva, notaFinal, notaTotal, pedidosAbertos, pendentes, podeDevolver, podeDevolverEmLote, prioridade, zeroAguardandoDecisao,
} from "@/domain/regras";
import { COMPETENCIAS, type Redacao } from "@/domain/types";
import { cn, dataCurta, dataHora, tempoRelativo } from "@/lib/utils";

type Filtro = "revisar" | "zero" | "devolvidas" | "todas";
type Ordem = "prioridade" | "antigas" | "confianca";

const aluno = (id: string) => ALUNOS.find((a) => a.id === id)!;
const turmaDe = (alunoId: string) => TURMAS.find((t) => t.id === aluno(alunoId).turmaId)!;
const inicio = (texto: string) => {
  const t = texto.replace(/\s+/g, " ").trim();
  return t.length > 70 ? `${t.slice(0, 70)}…` : t;
};

export function FilaPage() {
  const { estado, despachar } = useApp();
  const [filtro, setFiltro] = React.useState<Filtro>("revisar");
  const [turma, setTurma] = React.useState("");
  const [ordem, setOrdem] = React.useState<Ordem>("prioridade");
  const [confirmarLote, setConfirmarLote] = React.useState(false);

  const emAberto = (r: Redacao) => r.etapa !== "devolvida" || pedidosAbertos(r).length > 0;
  const abertas = estado.redacoes.filter(emAberto);
  const devolvidas = estado.redacoes.filter((r) => !emAberto(r));
  const prontas = abertas.filter(podeDevolverEmLote);
  const prontasForaDoLote = abertas.filter((r) => podeDevolver(r) && !podeDevolverEmLote(r)).length;

  const ordenar = (lista: Redacao[]) =>
    [...lista].sort((a, b) =>
      ordem === "antigas"
        ? new Date(a.enviadaEm).getTime() - new Date(b.enviadaEm).getTime()
        : ordem === "confianca"
          ? confiancaMedia(a) - confiancaMedia(b)
          : prioridade(b) - prioridade(a),
    );
  const porTurma = (r: { alunoId: string }) => !turma || aluno(r.alunoId).turmaId === turma;

  const mostrarAbertas =
    filtro === "revisar" || filtro === "todas" ? ordenar(abertas.filter(porTurma))
      : filtro === "zero" ? ordenar(abertas.filter((r) => porTurma(r) && zeroAguardandoDecisao(r)))
        : [];
  const mostrarDevolvidas = filtro === "devolvidas" || filtro === "todas" ? devolvidas.filter(porTurma) : [];
  const anteriores = filtro === "devolvidas" || filtro === "todas" ? DEVOLVIDAS_ANTERIORES.filter(porTurma) : [];
  const vazio = !mostrarAbertas.length && !mostrarDevolvidas.length && !anteriores.length;
  const nZero = abertas.filter(zeroAguardandoDecisao).length;

  const itensMedios = abertas.length
    ? abertas.reduce((s, r) => s + r.marcacoes.filter((m) => m.origem === "automatica" && m.status !== "pre_aprovada").length, 0) / abertas.length
    : 0;

  return (
    <div className="mx-auto max-w-5xl" data-testid="fila-page">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Redações para corrigir</h2>
          <p className="text-sm text-muted-foreground" data-testid="fila-proposta">{PROPOSTA.tema}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" title="Estimativa a partir do número de sugestões que ainda precisam da sua decisão" data-testid="fila-tempo-estimado">
            {abertas.length} a revisar · cerca de {Math.max(2, Math.round(2 + itensMedios * 0.5))} min cada
          </Badge>
          <Button size="sm" variant="outline" onClick={() => exportarNotas(estado.redacoes)} data-testid="fila-exportar">
            <Download /> Exportar notas (CSV)
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          aria-label="Situação"
          data-testid="fila-filtro-status"
          value={filtro}
          onValueChange={(v) => setFiltro(v as Filtro)}
          items={[
            { value: "revisar", label: `A revisar · ${abertas.length}`, testId: "fila-filtro-revisar" },
            { value: "zero", label: `Zero a decidir · ${nZero}`, testId: "fila-filtro-zero" },
            { value: "devolvidas", label: "Devolvidas", testId: "fila-filtro-devolvidas" },
            { value: "todas", label: "Todas", testId: "fila-filtro-todas" },
          ]}
        />
        <NativeSelect value={turma} onChange={(e) => setTurma(e.target.value)} aria-label="Turma" data-testid="fila-filtro-turma">
          <option value="">Todas as turmas</option>
          {TURMAS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </NativeSelect>
        <NativeSelect value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar por" data-testid="fila-ordem">
          <option value="prioridade">Prioridade</option>
          <option value="antigas">Mais antigas</option>
          <option value="confianca">Menos certeza da correção automática</option>
        </NativeSelect>
        {prontas.length > 0 && (
          confirmarLote ? (
            <span className="ml-auto flex flex-wrap items-center gap-1.5 text-sm" data-testid="fila-lote-confirmacao">
              Devolver {prontas.map((r) => `${aluno(r.alunoId).nome} (${notaTotal(r)})`).join(", ")}?
              {prontasForaDoLote > 0 && <span className="text-xs text-muted-foreground">Textos repetidos ficam de fora: compare as notas e devolva um a um.</span>}
              <Button size="sm" onClick={() => { despachar({ type: "devolver_varias", redacaoIds: prontas.map((r) => r.id) }); setConfirmarLote(false); }} data-testid="fila-lote-confirmar">Confirmar</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmarLote(false)}>Cancelar</Button>
            </span>
          ) : (
            <Button size="sm" className="ml-auto" onClick={() => setConfirmarLote(true)} data-testid="fila-devolver-prontas">
              <Send /> Devolver prontas · {prontas.length}
            </Button>
          )
        )}
      </div>

      <Card className="divide-y overflow-hidden" data-testid="fila-lista">
        {vazio && <p className="p-6 text-sm text-muted-foreground" data-testid="fila-vazia">Nada aqui com esses filtros.</p>}
        {mostrarAbertas.map((r) => {
          const p = pendentes(r).length;
          const pre = r.marcacoes.filter((m) => m.status === "pre_aprovada").length;
          const nova = r.etapa === "enviada";
          const pedidos = pedidosAbertos(r).length;
          return (
            <a
              key={r.id}
              href={`#/redacoes/${r.id}?visao=professor`}
              data-testid={`fila-item-${r.id}`}
              className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/60 md:grid-cols-[auto_1fr_auto_auto_auto]", nova && "bg-secondary/40")}
            >
              <Avatar nome={aluno(r.alunoId).nome} />
              <div className="min-w-0">
                <div className="font-semibold" data-testid="fila-item-nome">
                  {aluno(r.alunoId).nome} {nova && <Badge variant="highlight" className="ml-1">nova</Badge>}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {turmaDe(r.alunoId).nome} · {tempoRelativo(r.enviadaEm)} ({dataHora(r.enviadaEm)}){r.versao > 1 ? ` · reescrita v${r.versao}` : ""}
                </div>
                <div className="truncate font-serif text-xs italic text-muted-foreground" data-testid="fila-item-inicio">“{inicio(r.texto)}”</div>
              </div>
              <div className="col-span-3 flex flex-wrap gap-1.5 md:col-span-1 md:justify-end">
                {pedidos > 0 && <Badge variant="highlight" data-testid="fila-item-pedido">pedido de revisão</Badge>}
                {zeroAguardandoDecisao(r) && <Badge variant="erro" title={r.motivoZero ?? ""} data-testid="fila-item-risco-zero">zero a decidir</Badge>}
                {r.repeteRedacaoId && <Badge variant="atencao" data-testid="fila-item-repetida">texto repetido</Badge>}
                {!!r.alertas?.filter((a) => a !== "texto_repetido").length && (
                  <Badge variant="outline" data-testid="fila-item-alertas">{r.alertas.filter((a) => a !== "texto_repetido").length} alerta(s)</Badge>
                )}
                <Badge variant={p ? "atencao" : "acerto"} data-testid="fila-item-pendentes">
                  {p ? `${p} para revisar` : r.etapa === "devolvida" ? "devolvida" : zeroAguardandoDecisao(r) ? "falta decidir o zero" : "pronta para devolver"}
                </Badge>
                {pre > 0 && <Badge variant="outline" title="Sugestões de tipos em que você quase sempre concorda" data-testid="fila-item-pre">{pre} pré-aprovadas</Badge>}
              </div>
              <div className="hidden text-right font-mono text-base font-semibold md:block" title="Nota sugerida" data-testid="fila-item-nota">{notaTotal(r)}</div>
              <ChevronRight className="hidden size-4 text-muted-foreground md:block" />
            </a>
          );
        })}
        {mostrarDevolvidas.map((r) => (
          <a key={r.id} href={`#/redacoes/${r.id}?visao=professor`} data-testid={`fila-devolvida-${r.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 opacity-70 hover:bg-muted/60">
            <Avatar nome={aluno(r.alunoId).nome} />
            <div className="min-w-0">
              <div className="font-semibold">{aluno(r.alunoId).nome}</div>
              <div className="text-xs text-muted-foreground">{turmaDe(r.alunoId).nome} · devolvida {r.devolvidaEm ? tempoRelativo(r.devolvidaEm) : "agora"}</div>
              <div className="truncate font-serif text-xs italic text-muted-foreground">“{inicio(r.texto)}”</div>
            </div>
            <span className="font-mono font-semibold">{notaTotal(r)}</span>
          </a>
        ))}
        {anteriores.map((d) => (
          <div key={d.alunoId} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 opacity-55" data-testid={`fila-anterior-${d.alunoId}`}>
            <Avatar nome={aluno(d.alunoId).nome} />
            <div>
              <div className="font-semibold">{aluno(d.alunoId).nome}</div>
              <div className="text-xs text-muted-foreground">{turmaDe(d.alunoId).nome} · devolvida {d.quando}</div>
            </div>
            <span className="font-mono font-semibold">{d.nota}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function exportarNotas(redacoes: Redacao[]) {
  const linhas = [
    ["redacao_id", "aluno_id", "aluno", "turma", "proposta_id", "enviada_em", "situacao_da_nota", ...COMPETENCIAS.map((c) => `c${c}`), "total"],
    ...redacoes.map((r) => [
      r.id, r.alunoId, aluno(r.alunoId).nome, turmaDe(r.alunoId).nome, r.propostaId, dataHora(r.enviadaEm),
      r.etapa === "devolvida" ? "final (devolvida)" : "sugestão em revisão",
      ...COMPETENCIAS.map((c) => String(notaFinal(r, c))), String(notaTotal(r)),
    ]),
  ];
  const csv = linhas.map((l) => l.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "notas-carcara-revisa.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const EXPLICACAO_ETAPA = {
  enviada: "Chegou ao professor. A correção ainda não começou.",
  em_revisao: "O professor está corrigindo.",
  devolvida: "Pronta: toque para ver a folha marcada e a nota.",
} as const;

export function MinhasRedacoesPage() {
  const { estado } = useApp();
  const minhas = estado.redacoes.filter((r) => r.alunoId === USUARIO_ALUNO);
  const rotulo = { enviada: "Aguardando professor", em_revisao: "Em revisão", devolvida: "Devolutiva pronta" } as const;
  return (
    <div className="mx-auto max-w-3xl" data-testid="minhas-redacoes-page">
      <h2 className="mb-4 text-xl font-extrabold tracking-tight">Minhas redações</h2>
      <Card className="divide-y overflow-hidden">
        {!minhas.length && (
          <div className="p-6 text-sm text-muted-foreground" data-testid="minhas-redacoes-vazio">
            Você ainda não enviou redações. <a href="#/aluno/enviar" className="font-semibold text-primary underline">Enviar a primeira</a>
          </div>
        )}
        {minhas.map((r) => (
          <a key={r.id} href={`#/redacoes/${r.id}?visao=aluno`} className="grid gap-1 px-5 py-4 hover:bg-muted/60" data-testid={`minha-redacao-${r.id}`} data-etapa={r.etapa}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Enviada em {dataHora(r.enviadaEm)}{r.versao > 1 ? ` · versão ${r.versao}` : ""}</span>
              <Badge variant={r.etapa === "devolvida" ? "acerto" : "outline"} data-testid="minha-redacao-etapa">{rotulo[r.etapa]}</Badge>
            </div>
            <div className="truncate font-serif text-sm italic">“{inicio(r.texto)}”</div>
            <div className="text-xs text-muted-foreground" data-testid="minha-redacao-explicacao">
              {EXPLICACAO_ETAPA[r.etapa]}
              {r.etapa !== "devolvida" && ` Previsão: até ${dataCurta(dataPrevistaDevolutiva(r, PROPOSTA))}.`}
              {r.etapa === "devolvida" && ` Nota ${notaTotal(r)}.`}
            </div>
          </a>
        ))}
      </Card>
    </div>
  );
}
