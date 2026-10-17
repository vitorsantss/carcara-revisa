/**
 * Dados de demonstração. Todas as pessoas, a instituição e as redações são fictícias,
 * escritas para este MVP.
 */
import type {
  Aluno, AvaliacaoCompetencia, Calibragem, Competencia, Instituicao, Professor, Proposta,
  Redacao, ResultadoCorrecao, ResultadoTranscricao, Turma,
} from "./types";
import { montarRedacao } from "./regras";

export const INSTITUICAO: Instituicao = { id: "inst-1", nome: "Colégio Horizonte", cidade: "Natal, RN" };

export const TURMAS: Turma[] = [
  { id: "t-3a", nome: "3º A", anoLetivo: 2026, instituicaoId: "inst-1" },
  { id: "t-3b", nome: "3º B", anoLetivo: 2026, instituicaoId: "inst-1" },
];

export const PROFESSORES: Professor[] = [
  { id: "p-marina", nome: "Marina Costa", instituicaoId: "inst-1", turmaIds: ["t-3a", "t-3b"] },
  { id: "p-rafael", nome: "Rafael Lima", instituicaoId: "inst-1", turmaIds: ["t-3b"] },
];

export const ALUNOS: Aluno[] = [
  { id: "a-helena", nome: "Helena Campos", turmaId: "t-3a" },
  { id: "a-ana", nome: "Ana Luiza", turmaId: "t-3a" },
  { id: "a-bruno", nome: "Bruno Melo", turmaId: "t-3b" },
  { id: "a-davi", nome: "Davi Rocha", turmaId: "t-3a" },
  { id: "a-carla", nome: "Carla Souza", turmaId: "t-3a" },
  { id: "a-eduardo", nome: "Eduardo Pinto", turmaId: "t-3b" },
];

export const PROPOSTA: Proposta = {
  id: "prop-1",
  tema: "Os desafios para combater a desinformação nas redes sociais no Brasil",
  turmaIds: ["t-3a", "t-3b"],
  prazo: "2026-10-24",
};

export const USUARIO_ALUNO = "a-helena";
export const USUARIO_PROFESSOR = "p-marina";

export const CALIBRAGEM_INICIAL: Calibragem = {
  "1|erro": { casos: 46, concordancia: 44.5 },
  "1|atencao": { casos: 10, concordancia: 6 },
  "1|acerto": { casos: 12, concordancia: 11 },
  "2|acerto": { casos: 19, concordancia: 17 },
  "2|atencao": { casos: 12, concordancia: 7 },
  "3|acerto": { casos: 21, concordancia: 18 },
  "3|erro": { casos: 18, concordancia: 11 },
  "4|acerto": { casos: 33, concordancia: 32 },
  "4|erro": { casos: 22, concordancia: 19 },
  "4|atencao": { casos: 9, concordancia: 5 },
  "5|acerto": { casos: 35, concordancia: 34 },
  "5|atencao": { casos: 14, concordancia: 10 },
  "5|erro": { casos: 10, concordancia: 9 },
};

const av = (n: number, conf: number, passo: string): AvaliacaoCompetencia => ({ nota: n, confianca: conf, proximoPasso: passo });
const comps = (...x: AvaliacaoCompetencia[]) =>
  Object.fromEntries(x.map((v, i) => [i + 1, v])) as Record<Competencia, AvaliacaoCompetencia>;

/* ---------- redação de exemplo do envio (Helena) ---------- */
export const TEXTO_EXEMPLO = [
  "O escritor italiano Umberto Eco afirmou que as redes sociais deram voz a uma multidão que antes só falava em bares, sem prejuízo para a coletividade. A crítica ajuda a entender o Brasil atual, em que boatos ganham alcance de notícia. Esse quadro se mantém por causa da baixa leitura crítica da população e da omissão das escolas diante do tema.",
  "Em primeiro lugar, grande parte dos brasileiros lê apenas o título das publicações antes de compartilhar-las. Sem o hábito de conferir a fonte, o leitor transforma uma manchete chamativa em verdade, e o erro se multiplica a cada encaminhamento.",
  "Além disso, a escola ainda trata a internet como distração, e não como objeto de estudo. Assim, os jovens saem do ensino médio sabendo usar as redes, mas não sabem avaliar o que leem nelas, o que perpetua o problema.",
  "Dessarte, cabe às escolas, por meio de projetos interdisciplinares, ensinar a checar informações para que os alunos se tornem leitores críticos. Desse modo, a desinformação perderá força no país.",
].join("\n");

/** Transcrição simulada: a leitura da letra errou 3 palavras. "compartilhar-las" é erro real do aluno. */
export const TRANSCRICAO_EXEMPLO: ResultadoTranscricao = {
  texto: TEXTO_EXEMPLO.replace("multidão", "multidao").replace("encaminhamento", "encaminhamenlo").replace("o que leem nelas", "o que leern nelas"),
  duvidas: [
    { lido: "multidao", sugestoes: ["multidão"] },
    { lido: "encaminhamenlo", sugestoes: ["encaminhamento"] },
    { lido: "leern", sugestoes: ["leem", "lerem"] },
  ],
};

export const CORRECAO_EXEMPLO: ResultadoCorrecao = {
  motivoZero: null,
  avaliacao: comps(
    av(160, 0.8, "Troque “compartilhar-las” por “compartilhá-las”."),
    av(160, 0.75, "Retome a ideia de Umberto Eco no 2º parágrafo."),
    av(160, 0.7, "Acrescente um exemplo ao 3º parágrafo."),
    av(160, 0.7, "Prefira “Portanto” a “Dessarte” na conclusão."),
    av(160, 0.65, "Diga como os projetos funcionariam (ex.: uma aula por semana com notícias reais)."),
  ),
  marcacoes: [
    { competencia: 2, tipo: "acerto", trecho: "O escritor italiano Umberto Eco afirmou", comentario: "Repertório legitimado e pertinente ao tema.", confianca: 0.85 },
    { competencia: 3, tipo: "acerto", trecho: "Esse quadro se mantém por causa da baixa leitura crítica da população e da omissão das escolas diante do tema.", comentario: "Tese clara, com dois eixos.", confianca: 0.86 },
    { competencia: 1, tipo: "erro", trecho: "compartilhar-las", comentario: "Com verbo terminado em -r, o pronome vira “-la”.", sugestao: "compartilhá-las", confianca: 0.95 },
    { competencia: 3, tipo: "acerto", trecho: "o leitor transforma uma manchete chamativa em verdade", comentario: "Argumento que explica o mecanismo do problema.", confianca: 0.72 },
    { competencia: 4, tipo: "acerto", trecho: "Além disso, a escola", comentario: "Conectivo adequado entre parágrafos.", confianca: 0.9 },
    { competencia: 1, tipo: "atencao", trecho: "mas não sabem avaliar", comentario: "Quebra de paralelismo com “sabendo usar”.", sugestao: "sabendo usar as redes, mas sem saber avaliar", confianca: 0.55 },
    { competencia: 4, tipo: "atencao", trecho: "Dessarte", comentario: "Correto, mas raro; pode soar artificial.", sugestao: "Portanto", confianca: 0.5 },
    { competencia: 5, tipo: "acerto", trecho: "cabe às escolas", comentario: "Agente definido.", confianca: 0.85 },
    { competencia: 5, tipo: "acerto", trecho: "por meio de projetos interdisciplinares", comentario: "Meio de execução explícito.", confianca: 0.88 },
    { competencia: 5, tipo: "atencao", trecho: "para que os alunos se tornem leitores críticos", comentario: "Finalidade presente. Falta detalhar algum elemento da proposta.", sugestao: "Explique como os projetos funcionariam.", confianca: 0.6 },
  ],
};

/* ---------- redações já na fila ---------- */
const horasAtras = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

const ANA: ResultadoCorrecao = {
  motivoZero: null,
  avaliacao: comps(
    av(120, 0.8, "Corrija “os usuário” e “Houveram” e troque “a gente” por um termo formal."),
    av(160, 0.75, "Diga o que a pesquisa encontrou e como isso prova seu argumento."),
    av(120, 0.6, "Reescreva o 3º parágrafo: causa, consequência e um exemplo."),
    av(120, 0.7, "Troque o segundo “Além disso” por “Somado a isso”."),
    av(160, 0.65, "Detalhe o agente ou o meio (ex.: em parceria com as secretarias estaduais)."),
  ),
  marcacoes: [
    { competencia: 2, tipo: "acerto", trecho: "o sociólogo Zygmunt Bauman descreve uma sociedade marcada pela fluidez das relações", comentario: "Repertório legitimado e pertinente ao tema.", confianca: 0.85 },
    { competencia: 3, tipo: "acerto", trecho: "os desafios para combater a desinformação no Brasil estão ligados, sobretudo, à falta de educação midiática e à lógica dos algoritmos das plataformas digitais", comentario: "Tese clara, com dois eixos que organizam o texto.", confianca: 0.9 },
    { competencia: 2, tipo: "atencao", trecho: "Segundo pesquisa do Instituto Reuters", comentario: "Repertório pertinente, mas sem o dado que sustenta o argumento.", sugestao: "Cite o achado da pesquisa e o ano.", confianca: 0.55 },
    { competencia: 4, tipo: "acerto", trecho: "Dessa forma, quando", comentario: "Conectivo adequado ligando causa e consequência.", confianca: 0.8 },
    { competencia: 1, tipo: "erro", trecho: "os usuário tendem", comentario: "Concordância nominal: artigo no plural, substantivo no singular.", sugestao: "os usuários tendem", confianca: 0.95 },
    { competencia: 1, tipo: "erro", trecho: "Houveram", comentario: "Haver no sentido de existir é impessoal e fica no singular.", sugestao: "Houve", confianca: 0.95 },
    { competencia: 4, tipo: "erro", trecho: "Além disso, publicações", comentario: "Mesmo conectivo do período anterior.", sugestao: "Somado a isso, publicações", confianca: 0.8 },
    { competencia: 1, tipo: "erro", trecho: "faz a gente ver", comentario: "Registro informal.", sugestao: "faz os usuários verem", confianca: 0.85 },
    { competencia: 3, tipo: "erro", trecho: "Porém isso é um problema grave.", comentario: "Fecha o argumento sem consequência nem exemplo.", sugestao: "Explique como o engajamento favorece notícias falsas e traga um caso.", confianca: 0.6 },
    { competencia: 1, tipo: "erro", trecho: "à partir", comentario: "Não há crase antes de verbo.", sugestao: "a partir", confianca: 0.95 },
    { competencia: 5, tipo: "acerto", trecho: "o Ministério da Educação", comentario: "Agente definido.", confianca: 0.9 },
    { competencia: 5, tipo: "acerto", trecho: "por meio de aulas semanais com análise de notícias reais", comentario: "Meio de execução explícito.", confianca: 0.88 },
    { competencia: 5, tipo: "atencao", trecho: "a fim de que os jovens aprendam a checar fontes", comentario: "Finalidade clara. Falta detalhar algum elemento da proposta.", sugestao: "Acrescente um detalhamento.", confianca: 0.6 },
  ],
};
const TEXTO_ANA = [
  "No livro “Modernidade Líquida”, o sociólogo Zygmunt Bauman descreve uma sociedade marcada pela fluidez das relações e pela velocidade das informações. Essa leitura ajuda a compreender o cenário brasileiro atual, no qual as notícias falsas se espalham pelas redes sociais com mais rapidez do que as correções. Nesse contexto, os desafios para combater a desinformação no Brasil estão ligados, sobretudo, à falta de educação midiática e à lógica dos algoritmos das plataformas digitais.",
  "Em primeiro lugar, é importante destacar que muitos usuários não possuem ferramentas para avaliar a confiabilidade de uma fonte. Segundo pesquisa do Instituto Reuters, grande parte dos brasileiros se informa principalmente pelas redes sociais. Dessa forma, quando um conteúdo falso chega pelo celular, os usuário tendem a compartilhá-lo sem verificar a origem, principalmente se a mensagem confirma suas crenças. Houveram, inclusive, casos em que boatos sobre vacinas prejudicaram campanhas de imunização no país.",
  "Além disso, os algoritmos das plataformas priorizam conteúdos que geram engajamento. Além disso, publicações sensacionalistas atraem mais cliques, o que faz a gente ver cada vez mais notícias exageradas. Porém isso é um problema grave.",
  "Portanto, à partir dos argumentos apresentados, é necessário que o Ministério da Educação crie oficinas de educação midiática nas escolas públicas, por meio de aulas semanais com análise de notícias reais, a fim de que os jovens aprendam a checar fontes antes de compartilhar informações. Assim, a sociedade brasileira estará mais preparada para enfrentar a desinformação.",
].join("\n");

const BRUNO: ResultadoCorrecao = {
  motivoZero: null,
  avaliacao: comps(
    av(160, 0.85, "Corrija “tem” para “têm” no 3º parágrafo."),
    av(120, 0.6, "Retome o direito à informação no desenvolvimento."),
    av(160, 0.75, "Acrescente um caso concreto de conteúdo que continuou no ar."),
    av(160, 0.8, "Ligue as frases do 3º parágrafo com um conectivo de consequência."),
    av(160, 0.7, "Detalhe como a lei seria fiscalizada."),
  ),
  marcacoes: [
    { competencia: 2, tipo: "atencao", trecho: "A Constituição Federal de 1988 garante a todos o direito à informação.", comentario: "Repertório legitimado, mas pouco aproveitado no texto.", sugestao: "Retome o direito à informação no desenvolvimento.", confianca: 0.58 },
    { competencia: 3, tipo: "acerto", trecho: "Esse cenário é causado pela velocidade dos aplicativos de mensagem e pela ausência de responsabilização das plataformas.", comentario: "Tese com dois eixos bem definidos.", confianca: 0.88 },
    { competencia: 3, tipo: "acerto", trecho: "o leitor tende a confiar no remetente e não na fonte", comentario: "Argumento com autoria: explica o mecanismo do problema.", confianca: 0.7 },
    { competencia: 4, tipo: "acerto", trecho: "Ademais,", comentario: "Conectivo adequado entre parágrafos.", confianca: 0.92 },
    { competencia: 1, tipo: "erro", trecho: "tem pouco interesse", comentario: "Concordância verbal: sujeito no plural (as empresas).", sugestao: "têm pouco interesse", confianca: 0.93 },
    { competencia: 5, tipo: "acerto", trecho: "o Congresso Nacional", comentario: "Agente definido.", confianca: 0.95 },
    { competencia: 5, tipo: "acerto", trecho: "por meio de avisos visíveis nas próprias publicações", comentario: "Meio de execução explícito.", confianca: 0.9 },
    { competencia: 5, tipo: "atencao", trecho: "para que os usuários saibam que a informação é falsa", comentario: "Finalidade presente. Falta detalhar um elemento.", sugestao: "Explique quem fiscaliza a lei.", confianca: 0.62 },
  ],
};
const TEXTO_BRUNO = [
  "A Constituição Federal de 1988 garante a todos o direito à informação. Entretanto, no Brasil contemporâneo, esse direito é ameaçado pela circulação de notícias falsas nas redes sociais. Esse cenário é causado pela velocidade dos aplicativos de mensagem e pela ausência de responsabilização das plataformas.",
  "Primeiramente, os aplicativos de mensagem permitem que um conteúdo chegue a milhares de pessoas em poucos minutos. Como as mensagens são encaminhadas entre familiares e amigos, o leitor tende a confiar no remetente e não na fonte. Por isso, boatos sobre saúde e política se espalham rapidamente, prejudicando decisões importantes da população.",
  "Ademais, as empresas de tecnologia lucram com o engajamento e tem pouco interesse em remover publicações falsas. Sem regras claras, os conteúdos enganosos continuam no ar mesmo depois de desmentidos, o que dificulta o trabalho das agências de checagem.",
  "Logo, é preciso que o Congresso Nacional aprove uma lei que obrigue as plataformas a sinalizar conteúdos desmentidos por agências de checagem, por meio de avisos visíveis nas próprias publicações, para que os usuários saibam que a informação é falsa. Dessa maneira, o direito à informação será garantido.",
].join("\n");

const DAVI: ResultadoCorrecao = {
  motivoZero: "Texto com até 7 linhas: pelo edital, a nota é zero.",
  avaliacao: comps(
    av(0, 0.9, "Escreva entre 20 e 30 linhas."),
    av(0, 0.9, "Desenvolva dois argumentos com causa e consequência."),
    av(0, 0.9, "Planeje introdução, dois parágrafos de argumento e conclusão."),
    av(0, 0.9, "Use conectivos para ligar as ideias."),
    av(0, 0.9, "Diga quem faz, o quê, como, para quê e um detalhe."),
  ),
  marcacoes: [
    { competencia: 2, tipo: "acerto", trecho: "Muitas pessoas acreditam em tudo que veem na internet", comentario: "Você identificou bem uma causa do problema.", confianca: 0.7 },
    { competencia: 2, tipo: "atencao", trecho: "um problema muito grande", comentario: "Afirmação genérica, sem dado ou exemplo.", confianca: 0.8 },
    { competencia: 5, tipo: "erro", trecho: "O governo deveria fazer alguma coisa para resolver isso.", comentario: "Proposta vaga: agente genérico e sem ação, meio ou finalidade.", sugestao: "Ex.: o Ministério da Educação deve criar oficinas de checagem nas escolas.", confianca: 0.92 },
  ],
};
const TEXTO_DAVI = "As fake news são um problema muito grande no Brasil hoje em dia. Muitas pessoas acreditam em tudo que veem na internet e compartilham sem pensar. O governo deveria fazer alguma coisa para resolver isso.";

export function redacoesIniciais(cal: Calibragem): Redacao[] {
  const base = (id: string, alunoId: string, texto: string, horas: number, versao = 1, titulo?: string) => ({
    id, alunoId, propostaId: PROPOSTA.id, texto, titulo, enviadaEm: horasAtras(horas), versao,
    etapa: "em_revisao" as const, duvidasDeTranscricao: 0,
  });
  return [
    montarRedacao(base("r-ana", "a-ana", TEXTO_ANA, 30, 1, "Educação midiática como antídoto"), ANA, cal),
    montarRedacao(base("r-bruno", "a-bruno", TEXTO_BRUNO, 20, 2), BRUNO, cal),
    montarRedacao(base("r-davi", "a-davi", TEXTO_DAVI, 6), DAVI, cal),
  ];
}

/** Devolvidas antes (só para a lista). */
export const DEVOLVIDAS_ANTERIORES = [
  { alunoId: "a-carla", nota: 840, quando: "ontem" },
  { alunoId: "a-eduardo", nota: 600, quando: "há 2 dias" },
];
