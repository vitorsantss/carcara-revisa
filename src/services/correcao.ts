/**
 * Serviços externos do MVP. As implementações abaixo são SIMULADAS para a demo
 * funcionar offline e para os testes e2e serem determinísticos.
 * Em produção, troque por chamadas à API (ex.: POST /api/transcricoes e POST /api/correcoes).
 */
import type { AvaliacaoCompetencia, Competencia, Proposta, ResultadoCorrecao, ResultadoTranscricao } from "@/domain/types";
import { CORRECAO_EXEMPLO, TEXTO_EXEMPLO, TRANSCRICAO_EXEMPLO } from "@/domain/seed";
import { alertasDoTexto, checagens, frasesCopiadas } from "@/domain/regras";

export interface ServicoTranscricao {
  /** Uma ou mais folhas da mesma redação, na ordem (frente, verso…). */
  transcrever(imagens: Array<File | "exemplo">): Promise<ResultadoTranscricao>;
}
export interface ServicoCorrecao {
  corrigir(texto: string, proposta: Proposta, nomesDoAluno?: string[]): Promise<ResultadoCorrecao>;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** OCR simulado: qualquer imagem devolve a folha de exemplo com 3 palavras duvidosas. */
export const transcricaoSimulada: ServicoTranscricao = {
  async transcrever() {
    await espera(600);
    return structuredClone(TRANSCRICAO_EXEMPLO);
  },
};

/** Correção simulada: texto de exemplo tem gabarito; outros textos usam heurísticas simples. */
export const correcaoSimulada: ServicoCorrecao = {
  async corrigir(texto, proposta, nomesDoAluno = []) {
    await espera(500);
    if (texto === TEXTO_EXEMPLO) return structuredClone(CORRECAO_EXEMPLO);
    return heuristica(texto, proposta, nomesDoAluno);
  },
};

function primeiro(texto: string, re: RegExp): string | null {
  return texto.match(re)?.[0]?.trim() ?? null;
}

const MOTIVO_ZERO = {
  linhas: "Texto com até 7 linhas: pelas regras do Enem, a nota é zero.",
  copia: "Quase todo o texto é cópia dos textos motivadores. Sem as linhas copiadas, sobram até 7 linhas: pelas regras do Enem, a nota é zero.",
  identificacao: "Possível identificação do aluno no texto (nome ou assinatura). No Enem, isso zera a redação.",
  fuga: "Possível fuga total ao tema: o texto não trata do assunto pedido. No Enem, isso zera a redação.",
  narrativo: "O texto é um relato pessoal, não uma dissertação argumentativa. No Enem, não atender ao tipo de texto zera a redação.",
};

function heuristica(texto: string, proposta: Proposta, nomesDoAluno: string[]): ResultadoCorrecao {
  const ch = checagens(texto, proposta.tema);
  const alertas = alertasDoTexto(texto, proposta, nomesDoAluno);
  const copia = frasesCopiadas(texto, proposta.motivadores);
  const narrativo = alertas.includes("narrativo");
  const marcacoes: ResultadoCorrecao["marcacoes"] = [];
  const add = (m: ResultadoCorrecao["marcacoes"][number] | null) => m && marcacoes.push(m);

  for (const f of copia.frases) {
    add({ competencia: 2, tipo: "erro", trecho: f, comentario: "Frase copiada dos textos motivadores. No Enem, linhas copiadas não contam para a nota.", sugestao: "Escreva a ideia com suas palavras e acrescente um argumento seu.", confianca: 0.9 });
  }

  const errosC1: Array<[RegExp, string, string]> = [
    [/\ba gente\b/i, "Registro informal.", "nós / as pessoas"],
    [/\bhouveram\b/i, "Haver no sentido de existir fica no singular.", "Houve"],
    [/à partir/i, "Não há crase antes de verbo.", "a partir"],
    [/\bmenas\b/i, "A forma correta é “menos”.", "menos"],
    [/\bmais (?=[a-zà-ú]+(ão|ar|er)\b)/i, "Aqui o sentido pede “mas” (ideia contrária), não “mais”.", "mas"],
  ];
  let nErros = 0;
  for (const [re, com, sug] of errosC1) {
    const t = primeiro(texto, re);
    if (t) { nErros++; add({ competencia: 1, tipo: "erro", trecho: t, comentario: com, sugestao: sug, confianca: 0.85 }); }
  }

  const repertorio = primeiro(texto, /(segundo|de acordo com|conforme)\s[^,.;]{3,50}/i) ??
    primeiro(texto, /(o|a)\s(filósofo|filósofa|sociólogo|socióloga|escritor|escritora|pensador)\s[^,.;]{2,40}/i) ??
    primeiro(texto, /Constituição Federal[^,.;]{0,30}/);
  const repertorioCopiado = !!repertorio && copia.frases.some((f) => f.includes(repertorio));
  if (repertorio && !repertorioCopiado) add({ competencia: 2, tipo: "acerto", trecho: repertorio, comentario: "Você trouxe um repertório. Para valer mais, explique como ele prova o seu argumento.", confianca: 0.6 });

  const primeiroParagrafo = texto.split("\n")[0] ?? "";
  const frases = primeiroParagrafo.split(/(?<=\.)\s+/).filter((f) => f.length > 30);
  if (narrativo) {
    const relato = primeiro(texto, /[^.!?\n]*\b(eu|minha|meu)\b[^.!?\n]*[.!?]/i);
    if (relato) add({ competencia: 2, tipo: "erro", trecho: relato, comentario: "Aqui você conta uma experiência sua. A redação do Enem pede que você defenda uma opinião sobre o tema com argumentos.", sugestao: "Troque o relato por uma tese: o que você pensa sobre o problema e por quê.", confianca: 0.8 });
  } else {
    const tese = frases[frases.length - 1];
    if (tese && !terminaSemPonto(tese)) add({ competencia: 3, tipo: "acerto", trecho: tese.trim(), comentario: "Tese apresentada na introdução.", confianca: 0.55 });
  }

  const vistos = new Set<string>();
  const lower = texto.toLowerCase();
  for (const c of ch.conectivos.slice(0, 3)) {
    const i = lower.indexOf(c);
    if (i >= 0 && !vistos.has(c)) { vistos.add(c); add({ competencia: 4, tipo: "acerto", trecho: texto.slice(i, i + c.length), comentario: "Conectivo bem empregado.", confianca: 0.7 }); }
  }
  for (const c of ch.repetidos) {
    const i = lower.indexOf(c, lower.indexOf(c) + c.length);
    if (i >= 0) add({ competencia: 4, tipo: "erro", trecho: texto.slice(i, i + c.length), comentario: "Conectivo repetido. Varie para enriquecer a coesão.", sugestao: "Somado a isso / Nesse sentido", confianca: 0.75 });
  }

  const agente = primeiro(texto, /(o|a|as|os)\s(Ministério d[aoe]s?\s[\p{L}]+|Governo Federal|Estado|escolas?|mídia|Congresso Nacional|ONGs?)/iu);
  const meio = primeiro(texto, /por meio de\s[^,.;]{3,60}/i);
  const fim = primeiro(texto, /(a fim de|para que|com o intuito de)\s[^,.;]{3,60}/i);
  const acao = primeiro(texto, /(deve|devem|deveria|precisa|precisam|cabe|é necessário que|é preciso que)/i);
  const elementos = [agente, acao, meio, fim].filter(Boolean).length;
  if (agente) add({ competencia: 5, tipo: "acerto", trecho: agente, comentario: "Agente definido.", confianca: 0.7 });
  if (meio) add({ competencia: 5, tipo: "acerto", trecho: meio, comentario: "Meio de execução explícito.", confianca: 0.7 });
  if (fim) add({ competencia: 5, tipo: "atencao", trecho: fim, comentario: "Você disse para que serve a proposta. Acrescente um detalhe: como, quando ou quem fiscaliza.", confianca: 0.55 });

  const clamp = (n: number) => Math.max(0, Math.min(200, Math.round(n / 40) * 40));
  const av = (n: number, c: number, justificativa: string, passo: string): AvaliacaoCompetencia => ({ nota: clamp(n), confianca: c, justificativa, proximoPasso: passo });
  const faltam = [
    !agente && "quem faz (agente)", !acao && "o que faz (ação)", !meio && "como faz (meio)", !fim && "para quê (finalidade)", "um detalhamento",
  ].filter((x): x is string => !!x);
  const avaliacao: Record<Competencia, AvaliacaoCompetencia> = {
    1: av(200 - 40 * Math.min(4, nErros + 1), 0.6,
      nErros ? `${nErros} desvio${nErros > 1 ? "s" : ""} de norma marcado${nErros > 1 ? "s" : ""} no texto.` : "Nenhum desvio recorrente encontrado; a nota máxima exige revisão cuidadosa de acentos e vírgulas.",
      "Releia o texto procurando concordância e acentuação."),
    2: av((repertorio && !repertorioCopiado ? 160 : 120) - (copia.frases.length ? 40 : 0) - (narrativo ? 80 : 0), 0.5,
      narrativo ? "O texto relata uma experiência pessoal em vez de defender um ponto de vista."
        : copia.frases.length ? "Parte do texto repete os textos motivadores, e essas linhas não contam."
          : repertorio ? "Há repertório pertinente, mas ele precisa ser ligado ao argumento." : "Não há repertório de fora do texto (livro, lei, dado, fato histórico).",
      "Traga um repertório e explique como ele prova seu argumento."),
    3: av(ch.paragrafos >= 4 ? 120 : 80, 0.45,
      ch.paragrafos >= 4 ? "A estrutura tem introdução, desenvolvimento e conclusão, mas os argumentos são pouco desenvolvidos." : `O texto tem ${ch.paragrafos} parágrafo${ch.paragrafos > 1 ? "s" : ""}; falta desenvolver os argumentos em parágrafos próprios.`,
      "Desenvolva cada argumento com causa, consequência e exemplo."),
    4: av(120 + (ch.conectivos.length >= 4 ? 40 : 0) - (ch.repetidos.length ? 40 : 0), 0.6,
      ch.repetidos.length ? `Conectivos repetidos (${ch.repetidos.join(", ")}).` : `${ch.conectivos.length} conectivo${ch.conectivos.length === 1 ? "" : "s"} diferente${ch.conectivos.length === 1 ? "" : "s"} encontrados.`,
      "Varie os conectivos entre e dentro dos parágrafos."),
    5: av(40 * elementos, 0.55,
      elementos ? `A proposta tem ${elementos} dos 5 elementos esperados.` : "Não há proposta de intervenção identificável.",
      faltam.length ? `Acrescente: ${faltam.join(", ")}.` : "Garanta agente, ação, meio, finalidade e um detalhamento."),
  };

  const linhasSemCopia = Math.ceil(Math.max(0, texto.length - copia.frases.join(" ").length) / 70);
  const motivoZero = ch.zeraPorLinhas ? MOTIVO_ZERO.linhas
    : copia.frases.length && linhasSemCopia <= 7 ? MOTIVO_ZERO.copia
      : alertas.includes("identificacao") ? MOTIVO_ZERO.identificacao
        : alertas.includes("fuga_ao_tema") ? MOTIVO_ZERO.fuga
          : narrativo ? MOTIVO_ZERO.narrativo
            : null;

  return { motivoZero, alertas, avaliacao, marcacoes };
}

const terminaSemPonto = (frase: string) => !/[.!?]$/.test(frase.trim());
