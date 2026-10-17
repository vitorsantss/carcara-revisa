import * as React from "react";
import type { Calibragem, Competencia, Marcacao, Papel, Redacao, RegraAprendida, StatusMarcacao } from "@/domain/types";
import { CALIBRAGEM_INICIAL, redacoesIniciais } from "@/domain/seed";
import { chaveCalibragem, regraDaRecusa } from "@/domain/regras";

export interface EstadoApp {
  papel: Papel;
  redacoes: Redacao[];
  calibragem: Calibragem;
  regras: RegraAprendida[];
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
  | { type: "devolver"; redacaoId: string }
  | { type: "iniciar_revisao"; redacaoId: string };

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
    case "devolver":
      return atualizarRedacao(s, a.redacaoId, (r) => ({ ...r, etapa: "devolvida" }));
    case "iniciar_revisao":
      return atualizarRedacao(s, a.redacaoId, (r) => (r.etapa === "enviada" ? { ...r, etapa: "em_revisao" } : r));
  }
}

function estadoInicial(): EstadoApp {
  const calibragem = structuredClone(CALIBRAGEM_INICIAL);
  return { papel: "aluno", redacoes: redacoesIniciais(calibragem), calibragem, regras: [] };
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
