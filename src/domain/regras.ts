import type { Calibragem, Competencia, Marcacao, Redacao, ResultadoCorrecao, Tipo } from "./types";
import { COMPETENCIAS } from "./types";

/** Limiar para uma categoria chegar pré-aprovada. */
export const LIMIAR_CALIBRAGEM = { casos: 30, concordancia: 0.95, confiancaMinima: 0.8 };
/** Limites de discrepância usados pelo Inep para chamar terceiro corretor. */
export const LIMITE_INEP = { porCompetencia: 80, total: 100 };

export const chaveCalibragem = (c: Competencia, t: Tipo) => `${c}|${t}`;

export function taxa(cal: Calibragem, c: Competencia, t: Tipo) {
  const x = cal[chaveCalibragem(c, t)];
  return x ? { casos: x.casos, taxa: x.concordancia / x.casos } : { casos: 0, taxa: 0 };
}

export function preAprovada(cal: Calibragem, m: Pick<Marcacao, "competencia" | "tipo" | "confianca">) {
  const t = taxa(cal, m.competencia, m.tipo);
  return (
    t.casos >= LIMIAR_CALIBRAGEM.casos &&
    t.taxa >= LIMIAR_CALIBRAGEM.concordancia &&
    (m.confianca ?? 0) >= LIMIAR_CALIBRAGEM.confiancaMinima
  );
}

/**
 * Encontra cada trecho citado no texto. Trechos inexistentes são descartados
 * (a correção automática não pode inventar citação) e sobreposições são evitadas.
 */
export function localizarTrechos<T extends { trecho: string }>(texto: string, itens: T[]) {
  const usados: Array<[number, number]> = [];
  const encontrados: Array<T & { inicio: number; fim: number }> = [];
  let descartadas = 0;
  for (const item of itens) {
    if (!item.trecho) {
      descartadas++;
      continue;
    }
    let de = 0;
    let pos = -1;
    while ((pos = texto.indexOf(item.trecho, de)) !== -1) {
      const fim = pos + item.trecho.length;
      if (!usados.some(([a, b]) => pos < b && fim > a)) break;
      de = pos + 1;
    }
    if (pos === -1) {
      descartadas++;
      continue;
    }
    usados.push([pos, pos + item.trecho.length]);
    encontrados.push({ ...item, inicio: pos, fim: pos + item.trecho.length });
  }
  encontrados.sort((a, b) => a.inicio - b.inicio);
  return { encontrados, descartadas };
}

/** Expande uma seleção até palavras inteiras. */
export function expandirParaPalavras(texto: string, inicio: number, fim: number) {
  const letra = /[\p{L}\p{N}-]/u;
  while (inicio > 0 && letra.test(texto[inicio - 1])) inicio--;
  while (fim < texto.length && letra.test(texto[fim])) fim++;
  return { inicio, fim };
}

export function montarRedacao(
  base: Omit<Redacao, "avaliacaoAutomatica" | "marcacoes" | "marcacoesDescartadas" | "motivoZero" | "notasProfessor">,
  resultado: ResultadoCorrecao,
  calibragem: Calibragem,
): Redacao {
  const { encontrados, descartadas } = localizarTrechos(base.texto, resultado.marcacoes);
  const marcacoes: Marcacao[] = encontrados.map((m, i) => ({
    ...m,
    id: `${base.id}-a${i}`,
    origem: "automatica",
    status: preAprovada(calibragem, m) ? "pre_aprovada" : "pendente",
  }));
  return {
    ...base,
    motivoZero: resultado.motivoZero,
    avaliacaoAutomatica: resultado.avaliacao,
    notasProfessor: {},
    marcacoes,
    marcacoesDescartadas: descartadas,
  };
}

export const visivelParaAluno = (m: Marcacao) =>
  m.origem === "professor" || m.status === "aprovada" || m.status === "editada" || m.status === "pre_aprovada";

export const pendentes = (r: Redacao) => r.marcacoes.filter((m) => m.origem === "automatica" && m.status === "pendente");

export const notaFinal = (r: Redacao, c: Competencia) => r.notasProfessor[c] ?? r.avaliacaoAutomatica[c].nota;
export const notaTotal = (r: Redacao) => COMPETENCIAS.reduce((s, c) => s + notaFinal(r, c), 0);
export const notaAutomaticaTotal = (r: Redacao) => COMPETENCIAS.reduce((s, c) => s + r.avaliacaoAutomatica[c].nota, 0);

export const comentarioVisivel = (m: Marcacao) => (m.status === "editada" && m.comentarioEditado ? m.comentarioEditado : m.comentario);

export function confiancaMedia(r: Redacao) {
  const a = r.marcacoes.filter((m) => m.origem === "automatica");
  return a.length ? a.reduce((s, m) => s + (m.confianca ?? 0), 0) / a.length : 1;
}

export function prioridade(r: Redacao, agora = new Date()) {
  const horas = (agora.getTime() - new Date(r.enviadaEm).getTime()) / 36e5;
  return (r.motivoZero ? 100 : 0) + pendentes(r).length * 3 + horas / 6 + (1 - confiancaMedia(r)) * 20;
}

/* ---------- checagens fixas, sem IA ---------- */
const CONECTIVOS = [
  "além disso", "dessa forma", "desse modo", "nesse sentido", "nesse contexto", "portanto", "assim", "porém",
  "contudo", "entretanto", "no entanto", "todavia", "logo", "em primeiro lugar", "por fim", "ademais", "dessarte",
  "somado a isso", "ou seja", "visto que", "uma vez que", "diante disso", "primeiramente", "dessa maneira",
];

export function checagens(texto: string, tema: string) {
  const t = texto.trim();
  const low = t.toLowerCase();
  const linhas = Math.ceil(t.replace(/\n+/g, " ").length / 70);
  const paragrafos = t.split(/\n+/).filter((p) => p.trim()).length;
  const usados: Record<string, number> = {};
  for (const c of CONECTIVOS) {
    const re = new RegExp(`(^|[^\\p{L}])${c.replace(/ /g, "\\s+")}(?=[^\\p{L}]|$)`, "giu");
    const n = low.match(re)?.length ?? 0;
    if (n) usados[c] = n;
  }
  const palavrasTema = tema.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 5);
  const cobertura = palavrasTema.length
    ? palavrasTema.filter((w) => low.includes(w.slice(0, 6))).length / palavrasTema.length
    : 1;
  return {
    linhas,
    paragrafos,
    conectivos: Object.keys(usados),
    repetidos: Object.entries(usados).filter(([, n]) => n > 1).map(([c]) => c),
    cobertura,
    zeraPorLinhas: linhas <= 7,
  };
}

/** Regra genérica criada a partir de uma recusa, sem nenhum trecho da redação. */
export function regraDaRecusa(c: Competencia, motivo: string): string {
  const base: Record<string, string> = {
    "Não procede": `Na C${c}, só marque com evidência clara; construções aceitas pela norma não devem ser apontadas.`,
    "Competência errada": `Antes de marcar como C${c}, confira se o ponto pertence a essa competência.`,
    "Tipo errado": `Na C${c}, diferencie bem acerto, atenção e erro antes de marcar.`,
    "Comentário impreciso": `Na C${c}, explique a regra envolvida e mostre como corrigir.`,
    "Omissão": `Na C${c}, procure com mais atenção problemas desse tipo; o professor apontou uma omissão.`,
  };
  return base[motivo] ?? `Revisar os critérios da C${c}.`;
}

/** Bloqueia regra que repita 4 palavras seguidas da redação (evita vazar texto do aluno). */
export function regraVazaTexto(regra: string, texto: string) {
  const w = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter(Boolean);
  const a = w(regra);
  const b = ` ${w(texto).join(" ")} `;
  for (let i = 0; i + 4 <= a.length; i++) if (b.includes(` ${a.slice(i, i + 4).join(" ")} `)) return true;
  return false;
}
