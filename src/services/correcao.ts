/**
 * Serviços externos do MVP. As implementações abaixo são SIMULADAS para a demo
 * funcionar offline e para os testes e2e serem determinísticos.
 * Em produção, troque por chamadas à API (ex.: POST /api/transcricoes e POST /api/correcoes).
 */
import type { AvaliacaoCompetencia, Competencia, ResultadoCorrecao, ResultadoTranscricao } from "@/domain/types";
import { CORRECAO_EXEMPLO, TEXTO_EXEMPLO, TRANSCRICAO_EXEMPLO } from "@/domain/seed";
import { checagens } from "@/domain/regras";

export interface ServicoTranscricao {
  transcrever(imagem: File | "exemplo"): Promise<ResultadoTranscricao>;
}
export interface ServicoCorrecao {
  corrigir(texto: string, tema: string): Promise<ResultadoCorrecao>;
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
  async corrigir(texto, tema) {
    await espera(500);
    if (texto === TEXTO_EXEMPLO) return structuredClone(CORRECAO_EXEMPLO);
    return heuristica(texto, tema);
  },
};

function primeiro(texto: string, re: RegExp): string | null {
  return texto.match(re)?.[0]?.trim() ?? null;
}

function heuristica(texto: string, tema: string): ResultadoCorrecao {
  const ch = checagens(texto, tema);
  const marcacoes: ResultadoCorrecao["marcacoes"] = [];
  const add = (m: ResultadoCorrecao["marcacoes"][number] | null) => m && marcacoes.push(m);

  const errosC1: Array<[RegExp, string, string]> = [
    [/\ba gente\b/i, "Registro informal.", "nós / as pessoas"],
    [/\bhouveram\b/i, "Haver no sentido de existir fica no singular.", "Houve"],
    [/à partir/i, "Não há crase antes de verbo.", "a partir"],
    [/\bmenas\b/i, "A forma correta é “menos”.", "menos"],
    [/\bmais (?=[a-zà-ú]+(ão|ar|er)\b)/i, "Confira se não seria “mas” (oposição).", "mas"],
  ];
  let nErros = 0;
  for (const [re, com, sug] of errosC1) {
    const t = primeiro(texto, re);
    if (t) { nErros++; add({ competencia: 1, tipo: "erro", trecho: t, comentario: com, sugestao: sug, confianca: 0.85 }); }
  }

  const repertorio = primeiro(texto, /(segundo|de acordo com|conforme)\s[^,.;]{3,50}/i) ??
    primeiro(texto, /(o|a)\s(filósofo|filósofa|sociólogo|socióloga|escritor|escritora|pensador)\s[^,.;]{2,40}/i) ??
    primeiro(texto, /Constituição Federal[^,.;]{0,30}/);
  if (repertorio) add({ competencia: 2, tipo: "acerto", trecho: repertorio, comentario: "Repertório identificado. Confira se ele sustenta o argumento.", confianca: 0.6 });

  const primeiroParagrafo = texto.split("\n")[0] ?? "";
  const frases = primeiroParagrafo.split(/(?<=\.)\s+/).filter((f) => f.length > 30);
  const tese = frases[frases.length - 1];
  if (tese) add({ competencia: 3, tipo: "acerto", trecho: tese.trim(), comentario: "Tese apresentada na introdução.", confianca: 0.55 });

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
  const elementos = [agente, meio, fim].filter(Boolean).length;
  if (agente) add({ competencia: 5, tipo: "acerto", trecho: agente, comentario: "Agente definido.", confianca: 0.7 });
  if (meio) add({ competencia: 5, tipo: "acerto", trecho: meio, comentario: "Meio de execução explícito.", confianca: 0.7 });
  if (fim) add({ competencia: 5, tipo: "atencao", trecho: fim, comentario: "Finalidade presente. Confira se há detalhamento.", confianca: 0.55 });

  const clamp = (n: number) => Math.max(0, Math.min(200, Math.round(n / 40) * 40));
  const av = (n: number, c: number, p: string): AvaliacaoCompetencia => ({ nota: clamp(n), confianca: c, proximoPasso: p });
  const avaliacao: Record<Competencia, AvaliacaoCompetencia> = {
    1: av(200 - 40 * Math.min(4, nErros + 1), 0.6, "Releia o texto procurando concordância e acentuação."),
    2: av(repertorio ? 160 : 120, 0.5, "Traga um repertório e explique como ele prova seu argumento."),
    3: av(ch.paragrafos >= 4 ? 120 : 80, 0.45, "Desenvolva cada argumento com causa, consequência e exemplo."),
    4: av(120 + (ch.conectivos.length >= 4 ? 40 : 0) - (ch.repetidos.length ? 40 : 0), 0.6, "Varie os conectivos entre e dentro dos parágrafos."),
    5: av(40 * (elementos + (agente && meio && fim ? 1 : 0)), 0.55, "Garanta agente, ação, meio, finalidade e um detalhamento."),
  };
  return {
    motivoZero: ch.zeraPorLinhas ? "Texto com até 7 linhas: pelo edital, a nota é zero." : null,
    avaliacao,
    marcacoes,
  };
}
