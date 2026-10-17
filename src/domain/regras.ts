import type { Aluno, Calibragem, Competencia, Marcacao, NotasCompetencias, Professor, Proposta, Redacao, ResultadoCorrecao, Tipo, TipoAlerta } from "./types";
import { COMPETENCIAS, NOME_COMPETENCIA } from "./types";

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

/* ---------- versões e histórico ---------- */
const doAlunoNaProposta = (r: Redacao, alunoId: string, propostaId: string) => r.alunoId === alunoId && r.propostaId === propostaId;

/** Reenvio do mesmo aluno para a mesma proposta é a versão seguinte à maior já enviada. */
export function proximaVersao(redacoes: Redacao[], alunoId: string, propostaId: string) {
  return redacoes.filter((r) => doAlunoNaProposta(r, alunoId, propostaId)).reduce((maior, r) => Math.max(maior, r.versao), 0) + 1;
}

/** Versões devolvidas do aluno na proposta, da primeira para a última. */
export const historicoDoAluno = (redacoes: Redacao[], alunoId: string, propostaId: string) =>
  redacoes.filter((r) => doAlunoNaProposta(r, alunoId, propostaId) && r.etapa === "devolvida").sort((a, b) => a.versao - b.versao);

export const notasPorCompetencia = (r: Redacao) => COMPETENCIAS.map((c) => notaFinal(r, c)) as NotasCompetencias;
export const somaDasNotas = (notas: readonly number[]) => notas.reduce((s, n) => s + n, 0);

/** Maior versão devolvida do aluno na proposta, anterior à redação informada. */
export const versaoAnterior = (redacoes: Redacao[], r: Redacao) =>
  historicoDoAluno(redacoes, r.alunoId, r.propostaId).filter((x) => x.versao < r.versao).at(-1);

/** Versões devolvidas até a redação informada (inclusive, mesmo que ela ainda não tenha sido devolvida). */
export const historicoAte = (redacoes: Redacao[], r: Redacao) => [
  ...historicoDoAluno(redacoes, r.alunoId, r.propostaId).filter((x) => x.versao < r.versao),
  r,
];

const competenciaDoIndice = (i: number) => COMPETENCIAS[i];

/** Competência de menor nota; empate fica com a de menor número. */
export const competenciaMaisFraca = (notas: NotasCompetencias) => competenciaDoIndice(notas.indexOf(Math.min(...notas)));

/** Competência de maior nota; empate fica com a de menor número. */
export const melhorCompetencia = (notas: NotasCompetencias) => competenciaDoIndice(notas.indexOf(Math.max(...notas)));

export interface InsightsDeEvolucao {
  avanco: Competencia | null;
  ganho: number;
  foco: Competencia;
}

/** Onde o aluno mais avançou desde a versão anterior e onde focar agora (a menor nota atual). */
export function insightsDeEvolucao(atual: NotasCompetencias, anterior?: NotasCompetencias | null): InsightsDeEvolucao {
  const foco = competenciaMaisFraca(atual);
  if (!anterior) return { avanco: null, ganho: 0, foco };
  const diferencas = atual.map((v, i) => v - anterior[i]);
  const ganho = Math.max(...diferencas);
  return ganho > 0 ? { avanco: competenciaDoIndice(diferencas.indexOf(ganho)), ganho, foco } : { avanco: null, ganho: 0, foco };
}

/* ---------- desempenho da turma ---------- */
export interface DesempenhoAluno {
  alunoId: string;
  nome: string;
  historico: Redacao[];
  notas: NotasCompetencias;
  total: number;
}

/** Última versão devolvida de cada aluno da turma na proposta. Alunos sem devolvida ficam de fora. */
export function desempenhoDaTurma(
  redacoes: Redacao[],
  alunos: Array<Pick<Aluno, "id" | "nome" | "turmaId">>,
  turmaId: string,
  propostaId: string,
): DesempenhoAluno[] {
  return alunos
    .filter((a) => a.turmaId === turmaId)
    .map((a) => ({ aluno: a, historico: historicoDoAluno(redacoes, a.id, propostaId) }))
    .filter((x) => x.historico.length > 0)
    .map(({ aluno, historico }) => {
      const notas = notasPorCompetencia(historico[historico.length - 1]);
      return { alunoId: aluno.id, nome: aluno.nome, historico, notas, total: somaDasNotas(notas) };
    });
}

/** Média arredondada de cada competência. Sem alunos, tudo zero. */
export function mediaDaTurma(notasDosAlunos: NotasCompetencias[]): NotasCompetencias {
  return COMPETENCIAS.map((_, i) =>
    notasDosAlunos.length ? Math.round(notasDosAlunos.reduce((s, n) => s + n[i], 0) / notasDosAlunos.length) : 0,
  ) as NotasCompetencias;
}

/** Diferença entre o total da última versão e o da primeira. */
export function evolucaoTotal(historico: Redacao[]) {
  if (historico.length < 2) return 0;
  return notaTotal(historico[historico.length - 1]) - notaTotal(historico[0]);
}

export const competenciasAbaixoDaMedia = (notas: NotasCompetencias, media: NotasCompetencias) =>
  COMPETENCIAS.filter((_, i) => notas[i] < media[i]);

/** Alunos com nota até o limite na competência, para o relatório da turma. */
export const alunosEmRisco = (desempenho: DesempenhoAluno[], c: Competencia, limite = 80) =>
  desempenho.filter((d) => d.notas[c - 1] <= limite);

/** Aula sugerida para a competência mais fraca da turma. */
export const SUGESTAO_DE_AULA: Record<Competencia, string> = {
  1: "aula de revisão de concordância, regência e crase com frases das próprias redações reescritas pela turma",
  2: "aula sobre repertório legitimado: como escolher um dado, lei ou autor e ligá-lo ao argumento",
  3: "aula sobre projeto de texto: tese com dois eixos e um parágrafo de argumento com causa, consequência e exemplo",
  4: "aula sobre conectivos entre parágrafos e dentro deles, com um banco de alternativas para não repetir",
  5: "aula sobre os 5 elementos da proposta de intervenção: agente, ação, meio, finalidade e detalhamento",
};

/** Só o professor da turma exporta dados dos alunos dela (ADR-0010). */
export const podeExportar = (professor: Pick<Professor, "turmaIds"> | undefined, turmaId: string) =>
  !!professor && professor.turmaIds.includes(turmaId);

export type VisaoDesempenho = "aluno" | "turma";

export type DadosExportacao =
  | { visao: "aluno"; nome: string; historico: Redacao[] }
  | { visao: "turma"; turma: string; alunos: DesempenhoAluno[] };

/** Planilha da exportação: só nomes, números e notas, nunca texto de redação. */
export function linhasExportacao(visao: VisaoDesempenho, dados: DadosExportacao): Array<Array<string | number>> {
  const competencias = COMPETENCIAS.map((c) => `C${c}`);
  if (visao === "aluno" && dados.visao === "aluno") {
    return [
      ["Aluno", "Versão", ...competencias, "Total"],
      ...dados.historico.map((r) => [dados.nome, r.versao, ...notasPorCompetencia(r), notaTotal(r)]),
    ];
  }
  if (visao === "turma" && dados.visao === "turma") {
    return [
      ["Aluno", "Turma", ...competencias, "Total", "Redações"],
      ...dados.alunos.map((a) => [a.nome, dados.turma, ...a.notas, a.total, a.historico.length]),
    ];
  }
  return [];
}

const paraSlug = (s: string) => normalizar(s).replace(/[^a-z0-9]+/g, "");

/** `carcara-<turma>-<aaaa-mm-dd>.xlsx`, com a data local. */
export function nomeArquivoExportacao(turma: string, data: Date) {
  const dois = (n: number) => String(n).padStart(2, "0");
  return `carcara-${paraSlug(turma)}-${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}.xlsx`;
}

/* ---------- stories ---------- */
export interface MensagemMotivadora {
  frase: string;
  selos: string[];
}

const nomeMinusculo = (c: Competencia) => NOME_COMPETENCIA[c].toLowerCase();

/**
 * Frase e selos do story "Mensagem", de modelos fixos preenchidos com as notas.
 * Não usa IA e nunca cita o texto da redação.
 */
export function mensagemMotivadora(historico: Redacao[]): MensagemMotivadora {
  if (!historico.length) return { frase: "Minha primeira redação está a caminho.", selos: [] };
  const primeira = notasPorCompetencia(historico[0]);
  const ultima = notasPorCompetencia(historico[historico.length - 1]);
  const foco = competenciaMaisFraca(ultima);
  const melhor = melhorCompetencia(ultima);
  const selos = [
    ...(historico.length > 1 ? [`${historico.length} redações seguidas`] : []),
    `C${melhor} nível ${ultima[melhor - 1]}`,
  ];
  if (historico.length < 2) return { frase: `Primeira redação corrigida. Agora é treinar ${nomeMinusculo(foco)}.`, selos };

  const diferencas = ultima.map((v, i) => v - primeira[i]);
  const ganho = Math.max(...diferencas);
  const avanco = COMPETENCIAS[diferencas.indexOf(ganho)];
  const proximo = `Agora é afiar ${nomeMinusculo(foco)}.`;
  if (ganho <= 0) return { frase: `${historico.length} redações entregues e seguindo firme. ${proximo}`, selos };
  const antes = primeira[avanco - 1];
  const frase = antes > 0 && ultima[avanco - 1] >= antes * 2
    ? `Minha nota em ${nomeMinusculo(avanco)} dobrou desde a primeira redação. ${proximo}`
    : `Subi ${ganho} pontos em ${nomeMinusculo(avanco)} desde a primeira redação. ${proximo}`;
  return { frase, selos };
}

const ORDEM_DESTAQUE: Tipo[] = ["acerto", "erro", "atencao"];

/** Comentários para o resumo: um acerto, um erro e uma atenção, nessa ordem, completando pela ordem do texto. */
export function comentariosPrincipais(marcacoes: Marcacao[], limite = 3) {
  const visiveis = marcacoes.filter(visivelParaAluno).sort((a, b) => a.inicio - b.inicio);
  const escolhidos = ORDEM_DESTAQUE.map((t) => visiveis.find((m) => m.tipo === t)).filter((m): m is Marcacao => !!m);
  const resto = visiveis.filter((m) => !escolhidos.includes(m));
  return [...escolhidos, ...resto].slice(0, limite);
}

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
