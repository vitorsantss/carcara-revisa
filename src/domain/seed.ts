/**
 * Dados de demonstração. Todas as pessoas, a instituição e as redações são fictícias,
 * escritas para este MVP.
 */
import type {
  Aluno, AvaliacaoCompetencia, Calibragem, Competencia, Instituicao, NotasCompetencias, Professor, Proposta,
  Redacao, ResultadoCorrecao, ResultadoTranscricao, Turma,
} from "./types";
import { NOME_COMPETENCIA } from "./types";
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
  { id: "a-gabriel", nome: "Gabriel Nunes", turmaId: "t-3a" },
  { id: "a-isabela", nome: "Isabela Freitas", turmaId: "t-3a" },
];

export const PROPOSTA: Proposta = {
  id: "prop-1",
  tema: "Os desafios para combater a desinformação nas redes sociais no Brasil",
  temaCurto: "Desinformação nas redes sociais",
  turmaIds: ["t-3a", "t-3b"],
  prazo: "2026-10-24",
  motivadores: [
    "Uma pesquisa recente mostrou que sete em cada dez brasileiros já acreditaram em uma notícia falsa compartilhada nas redes sociais.",
    "Notícias falsas se espalham seis vezes mais rápido do que as verdadeiras, porque despertam emoções fortes como medo e indignação.",
    "A educação midiática ensina a checar a fonte, a data e o autor de uma informação antes de compartilhá-la.",
  ],
  nucleoDoTema: ["desinforma", "noticias falsas", "noticia falsa", "fake news", "boato", "checagem", "checar", "informacao falsa", "informacoes falsas", "mentira"],
  diasParaDevolutiva: 3,
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

const av = (n: number, conf: number, justificativa: string, passo: string): AvaliacaoCompetencia => ({ nota: n, confianca: conf, justificativa, proximoPasso: passo });
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
    av(160, 0.8, "Um desvio na posição do pronome (“compartilhar-las”); o restante segue a norma.", "Troque “compartilhar-las” por “compartilhá-las”."),
    av(160, 0.75, "Repertório reconhecido (Umberto Eco) e ligado ao tema, mas citado só na introdução.", "Retome a ideia de Umberto Eco no 2º parágrafo."),
    av(160, 0.7, "Tese clara com dois eixos; o 3º parágrafo afirma sem exemplo que comprove.", "Acrescente um exemplo ao 3º parágrafo."),
    av(160, 0.7, "Conectivos variados entre parágrafos; “Dessarte” é correto, mas soa artificial.", "Prefira “Portanto” a “Dessarte” na conclusão."),
    av(160, 0.65, "Agente, ação, meio e finalidade presentes; falta o detalhamento de um deles.", "Diga como os projetos funcionariam (ex.: uma aula por semana com notícias reais)."),
  ),
  marcacoes: [
    { competencia: 2, tipo: "acerto", trecho: "O escritor italiano Umberto Eco afirmou", comentario: "Repertório reconhecido (autor conhecido) e ligado ao tema.", confianca: 0.85 },
    { competencia: 3, tipo: "acerto", trecho: "Esse quadro se mantém por causa da baixa leitura crítica da população e da omissão das escolas diante do tema.", comentario: "Tese clara, com dois eixos.", confianca: 0.86 },
    { competencia: 1, tipo: "erro", trecho: "compartilhar-las", comentario: "Com verbo terminado em -r, o pronome vira “-la”.", sugestao: "compartilhá-las", confianca: 0.95 },
    { competencia: 3, tipo: "acerto", trecho: "o leitor transforma uma manchete chamativa em verdade", comentario: "Argumento que explica o mecanismo do problema.", confianca: 0.72 },
    { competencia: 4, tipo: "acerto", trecho: "Além disso, a escola", comentario: "Conectivo adequado entre parágrafos.", confianca: 0.9 },
    { competencia: 1, tipo: "atencao", trecho: "mas não sabem avaliar", comentario: "As duas partes da frase deveriam ter a mesma forma: “sabendo usar” pede “sem saber avaliar”.", sugestao: "sabendo usar as redes, mas sem saber avaliar", confianca: 0.55 },
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
    av(120, 0.8, "Quatro desvios: concordância (“os usuário”), “Houveram”, “à partir” e registro informal.", "Corrija “os usuário” e “Houveram” e troque “a gente” por um termo formal."),
    av(160, 0.75, "Dois repertórios pertinentes (Bauman e pesquisa Reuters); a pesquisa aparece sem o dado.", "Diga o que a pesquisa encontrou e como isso prova seu argumento."),
    av(120, 0.6, "Tese clara, mas o 3º parágrafo termina sem desenvolver o argumento.", "Reescreva o 3º parágrafo: causa, consequência e um exemplo."),
    av(120, 0.7, "Conectivos presentes, com “Além disso” repetido em frases seguidas.", "Troque o segundo “Além disso” por “Somado a isso”."),
    av(160, 0.65, "Proposta com agente, ação, meio e finalidade; falta um detalhamento.", "Detalhe o agente ou o meio (ex.: em parceria com as secretarias estaduais)."),
  ),
  marcacoes: [
    { competencia: 2, tipo: "acerto", trecho: "o sociólogo Zygmunt Bauman descreve uma sociedade marcada pela fluidez das relações", comentario: "Repertório reconhecido (autor conhecido) e ligado ao tema.", confianca: 0.85 },
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
    av(160, 0.85, "Um desvio de concordância verbal (“tem” no lugar de “têm”).", "Corrija “tem” para “têm” no 3º parágrafo."),
    av(120, 0.6, "Repertório reconhecido (Constituição), mas não volta a ser usado nos argumentos.", "Retome o direito à informação no desenvolvimento."),
    av(160, 0.75, "Tese com dois eixos e argumentos coerentes; falta um caso concreto no 3º parágrafo.", "Acrescente um caso concreto de conteúdo que continuou no ar."),
    av(160, 0.8, "Boa articulação entre parágrafos; dentro do 3º parágrafo as frases ficam soltas.", "Ligue as frases do 3º parágrafo com um conectivo de consequência."),
    av(160, 0.7, "Agente, ação, meio e finalidade presentes; falta detalhar a fiscalização.", "Detalhe como a lei seria fiscalizada."),
  ),
  marcacoes: [
    { competencia: 2, tipo: "atencao", trecho: "A Constituição Federal de 1988 garante a todos o direito à informação.", comentario: "Repertório reconhecido, mas pouco usado nos argumentos.", sugestao: "Retome o direito à informação no desenvolvimento.", confianca: 0.58 },
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
  motivoZero: "Texto com até 7 linhas: pelas regras do Enem, a nota é zero.",
  avaliacao: comps(
    av(0, 0.9, "Texto com até 7 linhas: pelas regras do Enem, todas as competências ficam com zero.", "Escreva entre 20 e 30 linhas."),
    av(0, 0.9, "Texto com até 7 linhas: pelas regras do Enem, todas as competências ficam com zero.", "Desenvolva dois argumentos com causa e consequência."),
    av(0, 0.9, "Texto com até 7 linhas: pelas regras do Enem, todas as competências ficam com zero.", "Planeje introdução, dois parágrafos de argumento e conclusão."),
    av(0, 0.9, "Texto com até 7 linhas: pelas regras do Enem, todas as competências ficam com zero.", "Use conectivos para ligar as ideias."),
    av(0, 0.9, "Texto com até 7 linhas: pelas regras do Enem, todas as competências ficam com zero.", "Diga quem faz, o quê, como, para quê e um detalhe."),
  ),
  marcacoes: [
    { competencia: 2, tipo: "acerto", trecho: "Muitas pessoas acreditam em tudo que veem na internet", comentario: "Você identificou bem uma causa do problema.", confianca: 0.7 },
    { competencia: 2, tipo: "atencao", trecho: "um problema muito grande", comentario: "Afirmação genérica, sem dado ou exemplo.", confianca: 0.8 },
    { competencia: 5, tipo: "erro", trecho: "O governo deveria fazer alguma coisa para resolver isso.", comentario: "Proposta vaga: agente genérico e sem ação, meio ou finalidade.", sugestao: "Ex.: o Ministério da Educação deve criar oficinas de checagem nas escolas.", confianca: 0.92 },
  ],
};
const TEXTO_DAVI = "As fake news são um problema muito grande no Brasil hoje em dia. Muitas pessoas acreditam em tudo que veem na internet e compartilham sem pensar. O governo deveria fazer alguma coisa para resolver isso.";

/* ---------- versões já devolvidas no 3º A (histórico para radar e desempenho) ---------- */
interface ParagrafoHistorico {
  texto: string;
  marcacao: ResultadoCorrecao["marcacoes"][number];
}

const INTRODUCOES: ParagrafoHistorico[] = [
  {
    texto: "A Constituição de 1988 assegura o acesso à informação, mas a circulação de boatos nas redes sociais ameaça esse direito no Brasil. Esse problema persiste por causa da falta de leitura crítica e da pressa em compartilhar.",
    marcacao: { competencia: 2, tipo: "acerto", trecho: "A Constituição de 1988 assegura o acesso à informação", comentario: "Repertório legítimo e ligado ao tema." },
  },
  {
    texto: "No filme “O Show de Truman”, o protagonista vive cercado por uma realidade fabricada. Fora da ficção, muitos brasileiros também consomem notícias falsas como se fossem verdade, o que enfraquece o debate público.",
    marcacao: { competencia: 2, tipo: "acerto", trecho: "No filme “O Show de Truman”", comentario: "Repertório pertinente, bem ligado ao tema." },
  },
  {
    texto: "Atualmente, a desinformação é um dos maiores problemas da sociedade brasileira. Isso acontece porque as pessoas não verificam o que recebem e porque as plataformas lucram com conteúdos chamativos.",
    marcacao: { competencia: 3, tipo: "atencao", trecho: "Atualmente, a desinformação é um dos maiores problemas", comentario: "Abertura genérica: comece com um fato ou um repertório." },
  },
  {
    texto: "Segundo o sociólogo Pierre Lévy, a internet criou uma inteligência coletiva. No Brasil, porém, essa rede também espalha mentiras com rapidez, e o combate à desinformação esbarra na baixa educação midiática e na omissão das plataformas.",
    marcacao: { competencia: 2, tipo: "acerto", trecho: "Segundo o sociólogo Pierre Lévy", comentario: "Repertório reconhecido e ligado ao tema." },
  },
];

const DESENVOLVIMENTOS: ParagrafoHistorico[] = [
  {
    texto: "Em primeiro lugar, a maioria dos usuários lê apenas a manchete antes de repassar uma mensagem. Sem conferir a fonte, o leitor transforma um boato em verdade e ajuda a espalhá-lo entre amigos e familiares.",
    marcacao: { competencia: 3, tipo: "acerto", trecho: "Sem conferir a fonte, o leitor transforma um boato em verdade", comentario: "Argumento que explica a causa do problema." },
  },
  {
    texto: "Além disso, os algoritmos mostram mais do que já agrada ao usuário. Dessa forma, as pessoas ficam presas em bolhas e passam a desconfiar de qualquer informação que contrarie suas crenças.",
    marcacao: { competencia: 4, tipo: "acerto", trecho: "Dessa forma,", comentario: "Conectivo adequado entre causa e consequência." },
  },
  {
    texto: "Outro fator é a falta de aulas sobre checagem nas escolas. Os jovens sabe usar as redes, mas poucos aprendem a avaliar se um site é confiável.",
    marcacao: { competencia: 1, tipo: "erro", trecho: "Os jovens sabe usar", comentario: "Concordância verbal: sujeito no plural pede verbo no plural.", sugestao: "Os jovens sabem usar" },
  },
  {
    texto: "Ademais, as plataformas digitais demoram a remover conteúdos desmentidos. Isso é muito grave.",
    marcacao: { competencia: 3, tipo: "erro", trecho: "Isso é muito grave.", comentario: "Afirmação sem desenvolvimento: explique a consequência e traga um exemplo." },
  },
];

const CONCLUSOES: ParagrafoHistorico[] = [
  {
    texto: "Portanto, cabe ao Ministério da Educação criar oficinas de checagem nas escolas, por meio de aulas semanais com notícias reais, para formar leitores críticos.",
    marcacao: { competencia: 5, tipo: "acerto", trecho: "por meio de aulas semanais com notícias reais", comentario: "Meio de execução explícito." },
  },
  {
    texto: "Logo, as escolas devem ensinar educação midiática para que a desinformação diminua no país.",
    marcacao: { competencia: 5, tipo: "atencao", trecho: "as escolas devem ensinar educação midiática", comentario: "Proposta com agente e ação; falta o meio e o detalhamento." },
  },
  {
    texto: "Dessa maneira, o governo precisa fazer campanhas sobre notícias falsas.",
    marcacao: { competencia: 5, tipo: "erro", trecho: "o governo precisa fazer campanhas", comentario: "Proposta vaga: diga quem faz, como e para quê." },
  },
  {
    texto: "Em suma, é necessário que o Congresso Nacional obrigue as plataformas a sinalizar conteúdos falsos, com avisos nas publicações, a fim de que os usuários reconheçam boatos antes de compartilhá-los.",
    marcacao: { competencia: 5, tipo: "acerto", trecho: "o Congresso Nacional", comentario: "Agente definido." },
  },
];

const NIVEL: Record<number, string> = {
  200: "Domínio excelente",
  160: "Bom domínio, com poucos desvios",
  120: "Domínio mediano",
  80: "Domínio insuficiente",
  40: "Domínio precário",
  0: "Sem domínio",
};

const PROXIMO_PASSO: Record<Competencia, string> = {
  1: "Releia o texto procurando desvios de concordância e acentuação.",
  2: "Use um repertório reconhecido e retome-o nos argumentos.",
  3: "Desenvolva cada argumento com causa, consequência e exemplo.",
  4: "Varie os conectivos entre os parágrafos e dentro deles.",
  5: "Escreva a proposta com agente, ação, meio, finalidade e detalhamento.",
};

export const HISTORICO_3A: Array<{ alunoId: string; versoes: NotasCompetencias[] }> = [
  { alunoId: "a-helena", versoes: [[120, 120, 120, 80, 120], [120, 160, 120, 120, 120], [160, 160, 120, 120, 120], [160, 160, 120, 160, 160]] },
  { alunoId: "a-ana", versoes: [[120, 120, 80, 120, 80], [160, 120, 120, 120, 80]] },
  { alunoId: "a-gabriel", versoes: [[80, 120, 80, 80, 40], [120, 120, 80, 80, 40]] },
  { alunoId: "a-davi", versoes: [[120, 120, 120, 120, 80], [120, 160, 120, 120, 120]] },
  { alunoId: "a-carla", versoes: [[120, 80, 80, 40, 40], [160, 80, 120, 40, 80]] },
  { alunoId: "a-isabela", versoes: [[160, 120, 120, 160, 120], [160, 160, 160, 160, 120]] },
];

const diasAtras = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

function redacaoHistorica(alunoId: string, indiceAluno: number, versao: number, totalVersoes: number, notas: NotasCompetencias, cal: Calibragem): Redacao {
  const k = (indiceAluno + versao) % 4;
  const paragrafos = [INTRODUCOES[k], DESENVOLVIMENTOS[k], DESENVOLVIMENTOS[(k + 2) % 4], CONCLUSOES[k]];
  const semanas = totalVersoes - versao + 1;
  const correcao: ResultadoCorrecao = {
    motivoZero: null,
    avaliacao: comps(...notas.map((n, i) => av(n, 0.8, `${NIVEL[n]} em ${NOME_COMPETENCIA[(i + 1) as Competencia].toLowerCase()}.`, PROXIMO_PASSO[(i + 1) as Competencia]))),
    marcacoes: paragrafos.map((p) => ({ ...p.marcacao, confianca: 0.85 })),
  };
  const redacao = montarRedacao(
    {
      id: `r-${alunoId.replace("a-", "")}-v${versao}`, alunoId, propostaId: PROPOSTA.id, texto: paragrafos.map((p) => p.texto).join("\n"),
      enviadaEm: diasAtras(semanas * 7 + 3), versao, etapa: "devolvida", duvidasDeTranscricao: 0, revisorId: USUARIO_PROFESSOR, devolvidaEm: diasAtras(semanas * 7),
    },
    correcao,
    cal,
  );
  return { ...redacao, marcacoes: redacao.marcacoes.map((m) => ({ ...m, status: "aprovada" })) };
}

export function redacoesIniciais(cal: Calibragem): Redacao[] {
  const base = (id: string, alunoId: string, texto: string, horas: number, versao = 1, titulo?: string) => ({
    id, alunoId, propostaId: PROPOSTA.id, texto, titulo, enviadaEm: horasAtras(horas), versao,
    etapa: "em_revisao" as const, duvidasDeTranscricao: 0,
  });
  return [
    montarRedacao(base("r-ana", "a-ana", TEXTO_ANA, 30, 3, "Educação midiática como antídoto"), ANA, cal),
    montarRedacao(base("r-bruno", "a-bruno", TEXTO_BRUNO, 20, 2), BRUNO, cal),
    montarRedacao(base("r-davi", "a-davi", TEXTO_DAVI, 6, 3), DAVI, cal),
    ...HISTORICO_3A.flatMap((h, i) => h.versoes.map((notas, v) => redacaoHistorica(h.alunoId, i, v + 1, h.versoes.length, notas, cal)).reverse()),
  ];
}

/** Devolvidas antes (só para a lista). */
export const DEVOLVIDAS_ANTERIORES = [{ alunoId: "a-eduardo", nota: 600, quando: "há 2 dias" }];
