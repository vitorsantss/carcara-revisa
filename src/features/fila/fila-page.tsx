import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useApp } from "@/store/app-store";
import { ALUNOS, DEVOLVIDAS_ANTERIORES, PROPOSTA, TURMAS } from "@/domain/seed";
import { confiancaMedia, notaTotal, pendentes, prioridade } from "@/domain/regras";
import { cn, tempoRelativo } from "@/lib/utils";
import type { Redacao } from "@/domain/types";

type Filtro = "revisar" | "devolvidas" | "todas";
type Ordem = "prioridade" | "antigas" | "confianca";

const aluno = (id: string) => ALUNOS.find((a) => a.id === id)!;
const turmaDe = (alunoId: string) => TURMAS.find((t) => t.id === aluno(alunoId).turmaId)!;

export function FilaPage() {
  const { estado } = useApp();
  const [filtro, setFiltro] = React.useState<Filtro>("revisar");
  const [turma, setTurma] = React.useState("");
  const [ordem, setOrdem] = React.useState<Ordem>("prioridade");

  const abertas = estado.redacoes.filter((r) => r.etapa !== "devolvida");
  const devolvidas = estado.redacoes.filter((r) => r.etapa === "devolvida");

  const ordenar = (lista: Redacao[]) =>
    [...lista].sort((a, b) =>
      ordem === "antigas"
        ? new Date(a.enviadaEm).getTime() - new Date(b.enviadaEm).getTime()
        : ordem === "confianca"
          ? confiancaMedia(a) - confiancaMedia(b)
          : prioridade(b) - prioridade(a),
    );
  const porTurma = (r: Redacao) => !turma || aluno(r.alunoId).turmaId === turma;

  const mostrarAbertas = filtro !== "devolvidas" ? ordenar(abertas.filter(porTurma)) : [];
  const mostrarDevolvidas = filtro !== "revisar" ? devolvidas.filter(porTurma) : [];
  const anteriores = filtro !== "revisar" ? DEVOLVIDAS_ANTERIORES.filter((d) => !turma || aluno(d.alunoId).turmaId === turma) : [];
  const vazio = !mostrarAbertas.length && !mostrarDevolvidas.length && !anteriores.length;

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
        <Badge variant="secondary" data-testid="fila-tempo-estimado">≈ {Math.max(2, Math.round(2 + itensMedios * 0.5))} min por redação</Badge>
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
          <option value="confianca">Menor confiança</option>
        </NativeSelect>
      </div>

      <Card className="divide-y overflow-hidden" data-testid="fila-lista">
        {vazio && <p className="p-6 text-sm text-muted-foreground" data-testid="fila-vazia">Nada aqui com esses filtros.</p>}
        {mostrarAbertas.map((r) => {
          const p = pendentes(r).length;
          const pre = r.marcacoes.filter((m) => m.status === "pre_aprovada").length;
          const nova = r.etapa === "enviada";
          return (
            <a
              key={r.id}
              href={`#/redacoes/${r.id}?visao=professor`}
              data-testid={`fila-item-${r.id}`}
              className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 hover:bg-muted/60 md:grid-cols-[auto_1fr_auto_auto_auto]", nova && "bg-secondary/40")}
            >
              <Avatar nome={aluno(r.alunoId).nome} />
              <div className="min-w-0">
                <div className="font-semibold" data-testid="fila-item-nome">
                  {aluno(r.alunoId).nome} {nova && <Badge variant="highlight" className="ml-1">nova</Badge>}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {turmaDe(r.alunoId).nome} · {tempoRelativo(r.enviadaEm)}{r.versao > 1 ? ` · reescrita v${r.versao}` : ""}
                </div>
              </div>
              <div className="col-span-3 flex flex-wrap gap-1.5 md:col-span-1 md:justify-end">
                {r.motivoZero && <Badge variant="erro" data-testid="fila-item-risco-zero">risco de nota zero</Badge>}
                <Badge variant={p ? "atencao" : "acerto"} data-testid="fila-item-pendentes">{p ? `${p} para revisar` : "pronta para devolver"}</Badge>
                {pre > 0 && <Badge variant="outline" data-testid="fila-item-pre">{pre} pré-aprovadas</Badge>}
              </div>
              <div className="hidden text-right font-mono text-base font-semibold md:block" data-testid="fila-item-nota">{notaTotal(r)}</div>
              <ChevronRight className="hidden size-4 text-muted-foreground md:block" />
            </a>
          );
        })}
        {mostrarDevolvidas.map((r) => (
          <a key={r.id} href={`#/redacoes/${r.id}?visao=professor`} data-testid={`fila-devolvida-${r.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 opacity-70 hover:bg-muted/60">
            <Avatar nome={aluno(r.alunoId).nome} />
            <div>
              <div className="font-semibold">{aluno(r.alunoId).nome}</div>
              <div className="text-xs text-muted-foreground">{turmaDe(r.alunoId).nome} · devolvida agora</div>
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

export function MinhasRedacoesPage() {
  const { estado } = useApp();
  const minhas = estado.redacoes.filter((r) => r.alunoId === "a-helena");
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
          <a key={r.id} href={`#/redacoes/${r.id}?visao=aluno`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/60" data-testid={`minha-redacao-${r.id}`}>
            <div className="min-w-0">
              <div className="truncate font-semibold">{PROPOSTA.tema}</div>
              <div className="text-xs text-muted-foreground">Enviada {tempoRelativo(r.enviadaEm)}</div>
            </div>
            <Badge variant={r.etapa === "devolvida" ? "acerto" : "outline"} data-testid="minha-redacao-etapa">{rotulo[r.etapa]}</Badge>
          </a>
        ))}
      </Card>
    </div>
  );
}
