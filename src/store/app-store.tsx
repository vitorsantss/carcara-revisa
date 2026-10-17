import * as React from "react";
import type { Calibragem, Competencia, Marcacao, Papel, Redacao, RegistroExportacao, RegraAprendida, SituacaoZero, StatusMarcacao } from "@/domain/types";
import { CALIBRAGEM_INICIAL, PROFESSORES, USUARIO_PROFESSOR, redacoesIniciais } from "@/domain/seed";
import { chaveCalibragem, podeDevolver, podeExportar, regraDaRecusa } from "@/domain/regras";

export interface EstadoApp {
  papel: Papel;
  redacoes: Redacao[];
  calibragem: Calibragem;
  regras: RegraAprendida[];
  exportacoes: RegistroExportacao[];
}

type Acao =
  | { type: "definir_papel"; papel: Papel }
  | { type: "enviar"; redacao: Redacao }
  | { type: "decidir"; redacaoId: string; marcacaoId: string; status: Extract<StatusMarcacao, "aprovada" | "recusada" | "editada">; motivo?: string; comentario?: string }
  | { type: "desfazer"; redacaoId: string; marcacaoId: string }
  | { type: "criar_marcacao"; redacaoId: string; marcacao: Marcacao }
  | { type: "editar_marcacao"; redacaoId: string; marcacaoId: string; patch: Partial<Marcacao> }
  | { type: "excluir_marcacao"; redacaoId: string; marcacaoId: string }
  | { type: "definir_nota"; redacaoId: string; competencia: Competencia; nota: number }
  | { type: "justificar_nota"; redacaoId: string; competencia: Competencia; justificativa: string }
  | { type: "decidir_zero"; redacaoId: string; situacao: Exclude<SituacaoZero, "sugerido">; justificativa?: string }
  | { type: "definir_mensagem_zero"; redacaoId: string; mensagem: string }
  | { type: "definir_recado"; redacaoId: string; recado: string }
  | { type: "devolver"; redacaoId: string }
  | { type: "devolver_varias"; redacaoIds: string[] }
  | { type: "iniciar_revisao"; redacaoId: string }
  | { type: "pedir_revisao"; redacaoId: string; competencia?: Competencia; mensagem: string }
  | { type: "reabrir"; redacaoId: string }
  | ({ type: "registrar_exportacao" } & Omit<RegistroExportacao, "id" | "quando">);

const PESO: Record<string, number> = { aprovada: 1, editada: 0.5, recusada: 0 };

function atualizarRedacao(s: EstadoApp, id: string, fn: (r: Redacao) => Redacao): EstadoApp {
  return { ...s, redacoes: s.redacoes.map((r) => (r.id === id ? fn(r) : r)) };
}

function somarCalibragem(cal: Calibragem, m: Marcacao, delta: number, casos: number): Calibragem {
  const k = chaveCalibragem(m.competencia, m.tipo);
  const atual = cal[k] ?? { casos: 0, concordancia: 0 };
  return { ...cal, [k]: { casos: atual.casos + casos, concordancia: atual.concordancia + delta } };
}

function reducer(s: EstadoApp, a: Acao): EstadoApp {
  switch (a.type) {
    case "definir_papel":
      return { ...s, papel: a.papel };
    case "enviar":
      return { ...s, redacoes: [a.redacao, ...s.redacoes] };
    case "decidir": {
      const r = s.redacoes.find((x) => x.id === a.redacaoId);
      const m = r?.marcacoes.find((x) => x.id === a.marcacaoId);
      if (!r || !m) return s;
      let cal = s.calibragem;
      const peso = PESO[a.status];
      if (m.origem === "automatica") {
        cal = m.pesoCalibragem === undefined ? somarCalibragem(cal, m, peso, 1) : somarCalibragem(cal, m, peso - m.pesoCalibragem, 0);
      }
      const regras =
        a.status === "recusada" && a.motivo
          ? [{ id: `${m.id}-${Date.now()}`, competencia: m.competencia, motivo: a.motivo, regra: regraDaRecusa(m.competencia, a.motivo) }, ...s.regras]
          : s.regras;
      const prox = atualizarRedacao(s, r.id, (red) => ({
        ...red,
        marcacoes: red.marcacoes.map((x) =>
          x.id === m.id
            ? { ...x, status: a.status, motivoRecusa: a.motivo, comentarioEditado: a.comentario ?? x.comentarioEditado, pesoCalibragem: m.origem === "automatica" ? peso : undefined }
            : x,
        ),
      }));
      return { ...prox, calibragem: cal, regras };
    }
    case "desfazer": {
      const r = s.redacoes.find((x) => x.id === a.redacaoId);
      const m = r?.marcacoes.find((x) => x.id === a.marcacaoId);
      if (!r || !m) return s;
      const cal = m.pesoCalibragem !== undefined ? somarCalibragem(s.calibragem, m, -m.pesoCalibragem, -1) : s.calibragem;
      const prox = atualizarRedacao(s, r.id, (red) => ({
        ...red,
        marcacoes: red.marcacoes.map((x) =>
          x.id === m.id ? { ...x, status: "pendente", motivoRecusa: undefined, comentarioEditado: undefined, pesoCalibragem: undefined } : x,
        ),
      }));
      return { ...prox, calibragem: cal };
    }
    case "criar_marcacao": {
      const prox = atualizarRedacao(s, a.redacaoId, (r) => ({
        ...r,
        marcacoes: [...r.marcacoes, a.marcacao].sort((x, y) => x.inicio - y.inicio),
      }));
      if (a.marcacao.tipo === "acerto") return prox;
      const regra: RegraAprendida = { id: `${a.marcacao.id}-omissao`, competencia: a.marcacao.competencia, motivo: "Omissão", regra: regraDaRecusa(a.marcacao.competencia, "Omissão") };
      return { ...prox, regras: [regra, ...prox.regras] };
    }
    case "editar_marcacao":
      return atualizarRedacao(s, a.redacaoId, (r) => ({
        ...r,
        marcacoes: r.marcacoes.map((x) => (x.id === a.marcacaoId ? { ...x, ...a.patch } : x)),
      }));
    case "excluir_marcacao":
      return atualizarRedacao(s, a.redacaoId, (r) => ({ ...r, marcacoes: r.marcacoes.filter((x) => x.id !== a.marcacaoId) }));
    case "definir_nota":
      return atualizarRedacao(s, a.redacaoId, (r) => ({ ...r, notasProfessor: { ...r.notasProfessor, [a.competencia]: a.nota } }));
    case "justificar_nota":
      return atualizarRedacao(s, a.redacaoId, (r) => ({ ...r, justificativasProfessor: { ...r.justificativasProfessor, [a.competencia]: a.justificativa } }));
    case "decidir_zero":
      return atualizarRedacao(s, a.redacaoId, (r) =>
        r.motivoZero ? { ...r, situacaoZero: a.situacao, justificativaZero: a.justificativa ?? r.justificativaZero } : r,
      );
    case "definir_mensagem_zero":
      return atualizarRedacao(s, a.redacaoId, (r) => ({ ...r, justificativaZero: a.mensagem || undefined }));
    case "definir_recado":
      return atualizarRedacao(s, a.redacaoId, (r) => ({ ...r, recadoProfessor: a.recado }));
    case "devolver":
      return atualizarRedacao(s, a.redacaoId, devolver);
    case "devolver_varias":
      return { ...s, redacoes: s.redacoes.map((r) => (a.redacaoIds.includes(r.id) ? devolver(r) : r)) };
    case "pedir_revisao":
      return atualizarRedacao(s, a.redacaoId, (r) => ({
        ...r,
        pedidosRevisao: [
          ...(r.pedidosRevisao ?? []),
          { id: `${r.id}-pedido-${Date.now()}`, competencia: a.competencia, mensagem: a.mensagem, criadoEm: new Date().toISOString(), atendido: false },
        ],
      }));
    case "reabrir":
      return atualizarRedacao(s, a.redacaoId, (r) => ({
        ...r,
        etapa: "em_revisao",
        pedidosRevisao: (r.pedidosRevisao ?? []).map((p) => ({ ...p, atendido: true })),
      }));
    case "registrar_exportacao": {
      const { type: _, ...dados } = a;
      if (!podeExportar(PROFESSORES.find((p) => p.id === dados.professorId), dados.turmaId)) return s;
      const quando = new Date().toISOString();
      return { ...s, exportacoes: [...s.exportacoes, { ...dados, id: `exp-${s.exportacoes.length + 1}-${Date.now()}`, quando }] };
    }
    case "iniciar_revisao":
      return atualizarRedacao(s, a.redacaoId, (r) => (r.etapa === "enviada" ? { ...r, etapa: "em_revisao" } : r));
  }
}

function devolver(r: Redacao): Redacao {
  if (!podeDevolver(r)) return r;
  return { ...r, etapa: "devolvida", revisorId: USUARIO_PROFESSOR, devolvidaEm: new Date().toISOString() };
}

function estadoInicial(): EstadoApp {
  const calibragem = structuredClone(CALIBRAGEM_INICIAL);
  return { papel: "aluno", redacoes: redacoesIniciais(calibragem), calibragem, regras: [], exportacoes: [] };
}

const Ctx = React.createContext<{ estado: EstadoApp; despachar: React.Dispatch<Acao> } | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [estado, despachar] = React.useReducer(reducer, undefined, estadoInicial);
  return <Ctx.Provider value={{ estado, despachar }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useApp precisa estar dentro de <AppProvider>");
  return v;
}

export function useRedacao(id: string | undefined) {
  const { estado } = useApp();
  return estado.redacoes.find((r) => r.id === id);
}
