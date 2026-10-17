/**
 * Modelo de dados do Carcará Revisa.
 * Instituição 1─N Turma 1─N Aluno; Professor N─N Turma; Proposta N─N Turma;
 * Redação pertence a um Aluno e a uma Proposta e carrega as marcações.
 */

export type Competencia = 1 | 2 | 3 | 4 | 5;
export const COMPETENCIAS: Competencia[] = [1, 2, 3, 4, 5];

export const NOME_COMPETENCIA: Record<Competencia, string> = {
  1: "Norma culta",
  2: "Tema e repertório",
  3: "Projeto de texto",
  4: "Coesão",
  5: "Proposta de intervenção",
};

/** Explicação em linguagem simples, para quem nunca ouviu falar da matriz do Enem. */
export const EXPLICACAO_COMPETENCIA: Record<Competencia, string> = {
  1: "Escrever seguindo as regras do português formal: ortografia, acentos, concordância e pontuação.",
  2: "Entender o tema, escrever um texto dissertativo-argumentativo (que defende uma opinião) e usar conhecimentos de fora do texto, como livros, leis, dados e fatos históricos.",
  3: "Organizar as ideias: ter uma opinião clara (tese) e defendê-la com argumentos bem explicados, do começo ao fim.",
  4: "Ligar bem as frases e os parágrafos, usando palavras como “além disso”, “portanto” e “no entanto”, sem repetir sempre as mesmas.",
  5: "Terminar com uma solução para o problema, dizendo quem faz, o que faz, como faz, para quê e um detalhe a mais.",
};

export type Tipo = "acerto" | "atencao" | "erro";
export const NOME_TIPO: Record<Tipo, string> = { acerto: "Acerto", atencao: "Atenção", erro: "Erro" };

export type Origem = "automatica" | "professor";

/** Situação da marcação dentro da revisão do professor. */
export type StatusMarcacao = "pendente" | "pre_aprovada" | "aprovada" | "editada" | "recusada";

export type EtapaRedacao = "enviada" | "em_revisao" | "devolvida";

export const NOTAS_VALIDAS = [0, 40, 80, 120, 160, 200] as const;

export interface Instituicao {
  id: string;
  nome: string;
  cidade: string;
}

export interface Professor {
  id: string;
  nome: string;
  instituicaoId: string;
  turmaIds: string[];
}

export interface Turma {
  id: string;
  nome: string;
  anoLetivo: number;
  instituicaoId: string;
}

export interface Aluno {
  id: string;
  nome: string;
  turmaId: string;
}

export interface Proposta {
  id: string;
  tema: string;
  turmaIds: string[];
  prazo: string;
  /** Textos motivadores da prova. Cópia deles é desconsiderada na correção. */
  motivadores: string[];
  /** Expressões que indicam que o texto trata do tema. Nenhuma presente sugere fuga ao tema. */
  nucleoDoTema: string[];
  /** Dias combinados para a devolutiva, contados do envio. */
  diasParaDevolutiva: number;
}

export interface Marcacao {
  id: string;
  competencia: Competencia;
  tipo: Tipo;
  trecho: string;
  inicio: number;
  fim: number;
  comentario: string;
  sugestao?: string;
  confianca?: number;
  origem: Origem;
  status: StatusMarcacao;
  motivoRecusa?: string;
  comentarioEditado?: string;
  /** Peso desta decisão já somado na calibragem (evita contar duas vezes). */
  pesoCalibragem?: number;
}

export interface AvaliacaoCompetencia {
  nota: number;
  confianca: number;
  /** Por que a nota ficou neste nível. */
  justificativa: string;
  /** O que falta para subir de nível. */
  proximoPasso: string;
}

/** Situação de um zero sugerido pelas checagens: o professor sempre decide. */
export type SituacaoZero = "sugerido" | "confirmado" | "anulado";

/** Alerta para o professor sobre o texto, sem carregar trecho da redação. */
export type TipoAlerta = "texto_incompleto" | "copia_motivadores" | "texto_repetido" | "identificacao" | "narrativo" | "fuga_ao_tema";

export interface PedidoRevisao {
  id: string;
  /** Ausente quando o pedido é sobre o zero, que vale para todas as competências. */
  competencia?: Competencia;
  mensagem: string;
  criadoEm: string;
  atendido: boolean;
}

export interface Redacao {
  id: string;
  alunoId: string;
  propostaId: string;
  titulo?: string;
  texto: string;
  enviadaEm: string;
  versao: number;
  etapa: EtapaRedacao;
  motivoZero?: string | null;
  situacaoZero?: SituacaoZero;
  justificativaZero?: string;
  avaliacaoAutomatica: Record<Competencia, AvaliacaoCompetencia>;
  notasProfessor: Partial<Record<Competencia, number>>;
  justificativasProfessor?: Partial<Record<Competencia, string>>;
  marcacoes: Marcacao[];
  marcacoesDescartadas: number;
  duvidasDeTranscricao: number;
  /** Fotos das folhas, em ordem (URLs locais da sessão). Vazio quando o texto foi colado. */
  imagens?: string[];
  alertas?: TipoAlerta[];
  /** Redação anterior do mesmo aluno com o mesmo texto. */
  repeteRedacaoId?: string;
  recadoProfessor?: string;
  revisorId?: string;
  devolvidaEm?: string;
  pedidosRevisao?: PedidoRevisao[];
}

/** Saída do serviço de correção automática (antes de virar Redação). */
export interface ResultadoCorrecao {
  motivoZero: string | null;
  alertas?: TipoAlerta[];
  avaliacao: Record<Competencia, AvaliacaoCompetencia>;
  marcacoes: Array<Omit<Marcacao, "id" | "inicio" | "fim" | "origem" | "status">>;
}

/** Saída do serviço de transcrição (OCR). */
export interface DuvidaTranscricao {
  lido: string;
  sugestoes: string[];
}
export interface ResultadoTranscricao {
  texto: string;
  duvidas: DuvidaTranscricao[];
}

/** Contagem de concordância do professor por competência e tipo (chave "C|tipo"). */
export type Calibragem = Record<string, { casos: number; concordancia: number }>;

export interface RegraAprendida {
  id: string;
  competencia: Competencia;
  motivo: string;
  regra: string;
}

export type Papel = "aluno" | "professor";
