# Consolidação das personas, rodada 3 (2026-10-17)

Build `63146dc-dirty`, depois das correções da rodada 2. As mesmas 5 personas rodaram em agentes isolados, com Playwright no device e na rede de cada uma, sem acesso aos relatórios anteriores. A execução foi interrompida duas vezes, uma por erro de certificado e outra por limite de uso, e retomada de onde parou. Mesmas regras de fusão e severidade e mesmas limitações das rodadas anteriores. Nenhum achado ficou sem evidência.

## Evolução nas três rodadas

| | Rodada 1 | Rodada 2 | Rodada 3 |
|---|---|---|---|
| Achados brutos | 96 | 81 | 77 |
| Severidade 4 (bruto) | 24 | 6 | 7 |
| Severidade 3 (bruto) | 40 | 26 | 24 |
| Severidade 2 e 1 (bruto) | 32 | 49 | 46 |
| Missões que falharam | 2 | 0 | 1 (Márcia M7: fechar a aba) |
| Recomendaria | ninguém | Gabriel (fase 3) | **Gabriel (fases 1 e 3)** |
| Clareza da devolutiva | 2, 3, 2, 2, 3 | 4, 4, 3, 3, 4 | 4, 4, 3, 3, 4 |
| Confiança no sistema | 1 a 2 | 1 a 3 | 1 a 3 (Gabriel e Thiago em 3) |

**De onde vêm as 7 severidades 4 da rodada 3:**
- 5 da leitura simulada da foto, com nota sobre um texto que o aluno não escreveu (Ana Clara, Josiane e Márcia);
- 1 de fechar a aba (Márcia);
- 1 nova e corrigível: folha em branco fotografada com luz amarela passa como redação (Ana Clara).

Nenhuma persona reencontrou os problemas que a rodada 2 mandou corrigir:
- comentário pré-aprovado rotulado como decisão do professor;
- mensagem do zero perdida;
- selo errado na fila;
- repetida devolvida em lote;
- assinatura com complemento não detectada;
- devolutiva de zero poluída;
- popup cortado com fonte em 150%;
- nota da C5 fora da grade;
- foto acima do texto.

## Matriz etapa × persona, rodada 3 (achados brutos)

| etapa | Ana Clara | Gabriel | Josiane | Márcia | Thiago |
|---|---|---|---|---|---|
| cadastro | 1×S3 | · | 1×S3 | 2×S2 | 1×S3 |
| envio | 2×S4 3×S3 3×S2 1×S1 | 1×S2 | 1×S4 4×S3 | · | · |
| filtro | · | 1×S3 1×S2 1×S1 | 1×S2 | 1×S3 | 2×S2 1×S1 |
| avaliador | · | 1×S3 1×S2 | · | 1×S4 1×S2 | 3×S3 |
| revisao_professor | · | 1×S3 | · | 1×S3 2×S2 1×S1 | 2×S3 4×S2 |
| devolutiva | 1×S4 2×S2 2×S1 | 2×S2 1×S1 | 1×S4 1×S3 4×S2 1×S1 | 2×S3 1×S2 | 2×S2 |
| transversal | 2×S2 | 1×S2 | 1×S3 3×S2 | 1×S4 1×S1 | 2×S2 |

## Lista priorizada, rodada 3 (achados fundidos)

Natureza: **[código]** corrigível já · **[mock]** efeito da leitura ou da correção simuladas · **[escopo]** fora do escopo atual · **[produto]** decisão sua.

### Severidade 4

| # | Achado | Personas | Origem | Natureza |
|---|---|---|---|---|
| W-01 | A leitura da foto devolve sempre a mesma redação, e a nota sai sobre um texto que o aluno não escreveu. | Ana Clara, Josiane, Márcia (Gabriel registrou como limitação) | A1 A-103, A-301; A3 A-003, A-011; P1 A-005 | [mock] |
| W-02 | Justificativas e marcações do avaliador simulado genéricas ou incoerentes fora do texto de exemplo. Exemplos: C1 160 com "nenhum desvio", "pelo Estado" marcado como agente, texto de IA com 720. | Gabriel, Márcia, Thiago | A2 A-009, A-007; P1 A-010; P2 A-007, A-008 | [mock] |
| W-03 | O rótulo "sugestão aceita automaticamente" faz o aluno duvidar de que o professor leu. | Ana Clara, Márcia | A1 A-303, P1 A-006 | [produto]: como mostrar a calibragem ao aluno |
| W-04 | Com o zero confirmado, ainda é preciso decidir as marcações para devolver. É a terceira rodada seguida com esse achado. | Márcia, Thiago | P1 A-009, P2 A-003 | [produto]: invariante 4 |
| W-05 | A cópia marca a frase inteira quando só um trecho coincide com os motivadores, e isso pesa no zero sugerido. | Gabriel, Thiago | A2 A-001, P2 A-009 | [código] |
| W-06 | A aluna vê "Entrar como Professor" e abre a fila com redações de outros alunos. | Josiane, Ana Clara | A3 A-002, A1 A-102 | [escopo]: seletor da demo, some com login |
| W-07 | A devolutiva sai sempre assinada por "Prof. Marina Costa". | Márcia, Thiago | P1 A-007, P2 A-016 | [escopo]: usuário fixo da demo |
| W-08 | Sem cadastro, idade, consentimento, turmas, temas ou duas escolas. | todas as 5 | A1 A-101, A3 A-001, P1 A-001, P2 A-001 | [escopo] |
| W-09 | Fechar a aba apaga tudo. | Márcia | P1 A-004 | [escopo]: ADR-0005 |
| W-10 | Folha em branco fotografada com luz amarela vira redação, sem "tem certeza?". | Ana Clara | A1 A-111 | [código] |

### Severidade 3

| # | Achado | Personas | Origem | Natureza |
|---|---|---|---|---|
| W-11 | Foto cortada e foto de seis linhas viram redação completa. A foto cortada é detectada, mas não há como pedir a folha de novo. | Ana Clara, Márcia | A1 A-105, A-109; P1 A-011 | [mock]+[produto] |
| W-12 | Corrigir a leitura exige reescrever tudo; "Tudo conferido" aparece depois de só 3 palavras. | Josiane | A3 A-004, A-005 | [mock]+[código] (texto) |
| W-13 | Com duas folhas, o verso não aparece, e uma redação nova recebe "você já enviou este texto". | Josiane | A3 A-006, A-007 | [mock] |
| W-14 | O motivo do zero já decidido aparece como "Possível fuga…", e um relato fora do tema é explicado só como fuga. | Josiane | A3 A-012, A-013 | [código] |
| W-15 | Sem internet, o texto some ao sair da tela, e não há reenvio quando a rede volta. | Ana Clara | A1 A-107 | [código] |
| W-16 | Mesmo texto com notas e justificativas contraditórias, e o aluno não vê que são a mesma redação. | Gabriel | A2 A-008 | [código]+[produto] |
| W-17 | Sem zero manual com motivo e sem como sinalizar justificativa ruim. | Thiago | P2 A-010, A-013 | [produto] |
| W-18 | A plataforma trocou a leitura por conferência e não economizou tempo (cerca de 17 min, contra 10 a 15 no papel). | Márcia | P1 A-014 | [mock]: depende da leitura real |

### Severidade 2 e 1 (resumo)

**Código:**
- A confirmação de devolução não recebe foco, e Enter não confirma (P2 A-011).
- "Escolher outra foto" volta para a folha em branco anterior (A1 A-112).
- Tocar no trecho no celular não mostra o comentário (A1 A-302).
- Rolagem horizontal na tela de envio com fonte 150% (A3 A-009).
- Zero ao lado de "Acertos 5" (A3 A-014).
- Sem rótulo de origem na nota (A2 A-006).
- Risco de zero some do status depois do envio (A1 A-110).

**Lacunas:**
- Política sem prazo de guarda (A2 A-004).
- Sem filtro de duplicadas na fila (P2 A-004).
- Sem banco de comentários (P2 A-014).
- Sem histórico (A2 A-010).
- Sem visão da turma (P2 A-017).
- Motivadores invisíveis para o professor (P2 A-002).

## Revisão manual obrigatória (regra 3, Ana Clara, menor de idade)

A-101 (cadastro: sem detecção de menoridade), A-102 (transversal: seletor de professor visível) e A-106 (transversal: carga em 3G). O W-06 (aluna abrindo a fila com redações de outros alunos) envolve dado de terceiros e só se resolve com autenticação.

## Leitura do resultado

- **O que depende do código atual está perto do limite.** O que sobra em severidade 3 e 4 no código são heurísticas (cópia por frase inteira, folha em branco com luz amarela, texto do motivo do zero) e o reenvio sem rede.
- **O resto exige outra etapa do projeto:**
  1. leitura real da foto e correção real (W-01, W-02, W-11 a W-13, W-18), pela skill `integrar-ia`;
  2. login e cadastro (W-06 a W-08);
  3. persistência (W-09).
- **Decisões que travam a aprovação dos professores:**
  - W-04: liberar a devolução com zero confirmado mexe na invariante 4;
  - W-03: como apresentar a pré-aprovação ao aluno;
  - W-17: zero manual e sinalização de justificativa.
