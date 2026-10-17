import type { Calibragem, Competencia, Marcacao, Proposta, Redacao, ResultadoCorrecao, Tipo, TipoAlerta } from "./types";
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

/** Completa palavras cortadas no início ou no fim do trecho, sem invadir as marcações vizinhas. */
function palavrasInteiras(texto: string, inicio: number, fim: number, limiteAntes: number, limiteDepois: number) {
  const r = expandirParaPalavras(texto, inicio, fim);
  const ini = r.inicio >= limiteAntes ? r.inicio : inicio;
  const f = r.fim <= limiteDepois ? r.fim : fim;
  return { inicio: ini, fim: f, trecho: texto.slice(ini, f) };
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
    ...palavrasInteiras(base.texto, m.inicio, m.fim, encontrados[i - 1]?.fim ?? 0, encontrados[i + 1]?.inicio ?? base.texto.length),
    id: `${base.id}-a${i}`,
    origem: "automatica",
    status: preAprovada(calibragem, m) ? "pre_aprovada" : "pendente",
  }));
  return {
    ...base,
    motivoZero: resultado.motivoZero,
    situacaoZero: resultado.motivoZero ? "sugerido" : undefined,
    alertas: [...new Set([...(base.alertas ?? []), ...(resultado.alertas ?? [])])],
    avaliacaoAutomatica: resultado.avaliacao,
    notasProfessor: {},
    marcacoes,
    marcacoesDescartadas: descartadas,
  };
}

export const visivelParaAluno = (m: Marcacao) =>
  m.origem === "professor" || m.status === "aprovada" || m.status === "editada" || m.status === "pre_aprovada";

export const pendentes = (r: Redacao) => r.marcacoes.filter((m) => m.origem === "automatica" && m.status === "pendente");

/** Zero sugerido ou confirmado vale até o professor anular. */
export const zeroAtivo = (r: Redacao) => !!r.motivoZero && r.situacaoZero !== "anulado";
export const zeroAguardandoDecisao = (r: Redacao) => !!r.motivoZero && (r.situacaoZero ?? "sugerido") === "sugerido";

/** Devolver exige zero marcações pendentes e, se houver zero sugerido, a decisão do professor. */
export const podeDevolver = (r: Redacao) => r.etapa !== "devolvida" && pendentes(r).length === 0 && !zeroAguardandoDecisao(r);

export const pedidosAbertos = (r: Redacao) => (r.pedidosRevisao ?? []).filter((p) => !p.atendido);

/** Lote só leva redações sem pontos que pedem comparação ou leitura atenta. */
export const podeDevolverEmLote = (r: Redacao) => podeDevolver(r) && !r.repeteRedacaoId;

export const notaFinal = (r: Redacao, c: Competencia) => (zeroAtivo(r) ? 0 : r.notasProfessor[c] ?? r.avaliacaoAutomatica[c].nota);
export const notaAlteradaPeloProfessor = (r: Redacao, c: Competencia) =>
  !zeroAtivo(r) && r.notasProfessor[c] !== undefined && r.notasProfessor[c] !== r.avaliacaoAutomatica[c].nota;
export const notaTotal = (r: Redacao) => COMPETENCIAS.reduce((s, c) => s + notaFinal(r, c), 0);
export const notaAutomaticaTotal = (r: Redacao) => COMPETENCIAS.reduce((s, c) => s + r.avaliacaoAutomatica[c].nota, 0);

/** Quem responde por cada comentário diante do aluno. */
export type Autoria = "professor" | "editada" | "aprovada" | "pre_aprovada";
export const autoria = (m: Marcacao): Autoria =>
  m.origem === "professor" ? "professor" : m.status === "editada" ? "editada" : m.status === "pre_aprovada" ? "pre_aprovada" : "aprovada";
export const ROTULO_AUTORIA: Record<Autoria, string> = {
  professor: "Escrito pelo professor",
  editada: "Ajustado pelo professor",
  aprovada: "Sugestão aprovada pelo professor",
  pre_aprovada: "Sugestão aceita automaticamente: o professor confia neste tipo de correção",
};

export const comentarioVisivel = (m: Marcacao) => (m.status === "editada" && m.comentarioEditado ? m.comentarioEditado : m.comentario);

export function confiancaMedia(r: Redacao) {
  const a = r.marcacoes.filter((m) => m.origem === "automatica");
  return a.length ? a.reduce((s, m) => s + (m.confianca ?? 0), 0) / a.length : 1;
}

export function prioridade(r: Redacao, agora = new Date()) {
  const horas = (agora.getTime() - new Date(r.enviadaEm).getTime()) / 36e5;
  return (zeroAguardandoDecisao(r) ? 100 : 0) + pedidosAbertos(r).length * 50 + pendentes(r).length * 3 + horas / 6 + (1 - confiancaMedia(r)) * 20;
}

export function dataPrevistaDevolutiva(r: Pick<Redacao, "enviadaEm">, proposta: Pick<Proposta, "diasParaDevolutiva">) {
  return new Date(new Date(r.enviadaEm).getTime() + proposta.diasParaDevolutiva * 864e5);
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

/* ---------- checagens do texto antes e depois do envio ---------- */
const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const palavras = (s: string) => normalizar(s).split(/[^a-z0-9]+/).filter(Boolean);

/** Linhas que identificam o aluno: rótulos (Nome:, Turma:…), o nome dele ou uma assinatura solta no fim. */
export function linhasDeIdentificacao(texto: string, nomes: string[] = []): number[] {
  const linhas = texto.split("\n");
  const ultima = linhas.reduce((u, l, i) => (l.trim() ? i : u), -1);
  const nomesNorm = nomes.map(normalizar).filter((n) => n.includes(" ")).flatMap((n) => {
    const partes = n.split(/\s+/);
    return [n, `${partes[0]} ${partes[partes.length - 1]}`];
  });
  return linhas
    .map((linha, i) => {
      const l = linha.trim();
      if (!l) return -1;
      const rotulo = /^(nome|aluno|aluna|turma|matr[ií]cula|e-?mail|telefone)\s*[:\-]/i.test(l);
      const temNome = nomesNorm.some((n) => normalizar(l).includes(n));
      const assinatura = i === ultima && l.length <= 60 && !/[.!?;:]$/.test(l) && /^(\p{Lu}[\p{Ll}']+\s+){1,3}\p{Lu}[\p{Ll}']+(\s*[-–,|/].{0,40})?$/u.test(l);
      return rotulo || temNome || assinatura ? i : -1;
    })
    .filter((i) => i >= 0);
}

export const removerLinhas = (texto: string, indices: number[]) =>
  texto.split("\n").filter((_, i) => !indices.includes(i)).join("\n").trim();

/** Texto que acaba sem pontuação final costuma ser foto cortada ou folha faltando. */
export const terminaIncompleto = (texto: string) => {
  const t = texto.trim();
  return t.length > 0 && !/[.!?…"”)]$/.test(t);
};

/** Frases da redação copiadas dos textos motivadores (6 palavras seguidas iguais). */
export function frasesCopiadas(texto: string, motivadores: string[]) {
  const n = 6;
  const fonte = new Set<string>();
  for (const m of motivadores) {
    const w = palavras(m);
    for (let i = 0; i + n <= w.length; i++) fonte.add(w.slice(i, i + n).join(" "));
  }
  const frases = texto.split(/(?<=[.!?])\s+|\n+/).map((f) => f.trim()).filter(Boolean);
  const copiadas = frases.filter((f) => {
    const w = palavras(f);
    for (let i = 0; i + n <= w.length; i++) if (fonte.has(w.slice(i, i + n).join(" "))) return true;
    return false;
  });
  const total = palavras(texto).length;
  const palavrasCopiadas = copiadas.reduce((s, f) => s + palavras(f).length, 0);
  return { frases: copiadas, proporcao: total ? palavrasCopiadas / total : 0 };
}

/** Nenhuma expressão do núcleo do tema no texto sugere fuga total ao tema. */
export const foraDoTema = (texto: string, nucleo: string[]) => {
  const t = normalizar(texto);
  return nucleo.length > 0 && !nucleo.some((e) => t.includes(normalizar(e)));
};

/** Relato pessoal: muita primeira pessoa do singular. O Enem pede dissertação argumentativa. */
export function pareceRelatoPessoal(texto: string) {
  const w = palavras(texto);
  const primeiraPessoa = w.filter((x) => ["eu", "meu", "minha", "meus", "minhas", "comigo"].includes(x)).length;
  return primeiraPessoa >= 5 && primeiraPessoa / Math.max(1, w.length) >= 0.025;
}

export const mesmoTexto = (a: string, b: string) => palavras(a).join(" ") === palavras(b).join(" ");

export const redacaoRepetida = (texto: string, alunoId: string, redacoes: Redacao[]) =>
  redacoes.find((r) => r.alunoId === alunoId && mesmoTexto(r.texto, texto));

export function alertasDoTexto(texto: string, proposta: Pick<Proposta, "motivadores" | "nucleoDoTema">, nomes: string[] = []): TipoAlerta[] {
  const alertas: TipoAlerta[] = [];
  const identificacao = linhasDeIdentificacao(texto, nomes);
  if (terminaIncompleto(removerLinhas(texto, identificacao))) alertas.push("texto_incompleto");
  if (frasesCopiadas(texto, proposta.motivadores).frases.length) alertas.push("copia_motivadores");
  if (identificacao.length) alertas.push("identificacao");
  if (pareceRelatoPessoal(texto)) alertas.push("narrativo");
  if (foraDoTema(texto, proposta.nucleoDoTema)) alertas.push("fuga_ao_tema");
  return alertas;
}

/** Orientação para o aluno não repetir o motivo do zero. */
export function comoEvitarZero(motivo: string) {
  const m = normalizar(motivo);
  if (m.includes("copia")) return "Use os textos motivadores só como inspiração e escreva tudo com suas palavras.";
  if (m.includes("7 linhas")) return "Escreva pelo menos 8 linhas próprias; o ideal é entre 20 e 30, em 4 parágrafos.";
  if (m.includes("identificacao")) return "Não escreva seu nome, assinatura ou apelido em nenhuma parte do texto.";
  if (m.includes("tema")) return "Leia o tema com calma antes de começar e confira, a cada parágrafo, se você está falando dele.";
  if (m.includes("relato") || m.includes("tipo de texto")) return "Em vez de contar sua história, defenda uma opinião sobre o tema com argumentos e termine com uma proposta.";
  return "Releia as regras da redação do Enem com seu professor antes da próxima.";
}

export const TEXTO_ALERTA: Record<TipoAlerta, { professor: string; aluno: string }> = {
  texto_incompleto: {
    professor: "O texto termina sem pontuação final: pode ser foto cortada ou folha faltando. Confira a foto original.",
    aluno: "Seu texto parece terminar no meio de uma frase. Faltou fotografar alguma parte ou o verso da folha?",
  },
  copia_motivadores: {
    professor: "Há frases copiadas dos textos motivadores. No Enem, linhas copiadas não contam.",
    aluno: "Algumas frases são iguais às dos textos motivadores. No Enem, frases copiadas não contam para a nota.",
  },
  texto_repetido: {
    professor: "Este aluno já enviou este mesmo texto antes. Compare as duas correções.",
    aluno: "Você já enviou este mesmo texto. Enviar de novo cria outra correção do mesmo texto.",
  },
  identificacao: {
    professor: "Há uma linha que parece identificar o aluno (nome ou assinatura). No Enem, identificação zera a redação.",
    aluno: "Encontramos o que parece ser seu nome ou uma assinatura. No Enem, isso zera a redação.",
  },
  narrativo: {
    professor: "O texto usa muita primeira pessoa e parece relato pessoal, não dissertação argumentativa.",
    aluno: "Seu texto conta uma experiência pessoal. A redação do Enem pede que você defenda uma opinião com argumentos; um relato pode zerar a redação.",
  },
  fuga_ao_tema: {
    professor: "O texto não menciona o núcleo do tema. Confira se houve fuga ao tema, que zera no Enem.",
    aluno: "Seu texto não fala do tema pedido. No Enem, escrever sobre outro assunto zera a redação.",
  },
};
