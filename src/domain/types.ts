/**
 * Modelo de dados do Marca-Texto.
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
  proximoPasso: string;
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
  avaliacaoAutomatica: Record<Competencia, AvaliacaoCompetencia>;
  notasProfessor: Partial<Record<Competencia, number>>;
  marcacoes: Marcacao[];
  marcacoesDescartadas: number;
  duvidasDeTranscricao: number;
}

/** Saída do serviço de correção automática (antes de virar Redação). */
export interface ResultadoCorrecao {
  motivoZero: string | null;
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
