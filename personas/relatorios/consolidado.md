# Consolidação das personas, 2026-10-17

Build `94c047f-dirty`, http://localhost:5173. Cada persona rodou num agente separado, com Playwright no device e na rede da própria persona, sem acesso ao trabalho das outras. Relatórios individuais: `<persona-id>-fase-<n>.json/.md` nesta pasta, capturas em `capturas/<persona>/`.

## Como ler

- **96 achados brutos**: Ana Clara 19, Gabriel 16, Josiane 22, Márcia 21, Thiago 18. Todos têm evidência; nenhum foi descartado pela regra 4.
- **Fusão (regra 1):** cada agente escreveu `seletor_visivel` num formato diferente (`[data-testid=x]`, `data-testid=x`, `role=…`, `text=…`). Normalizei os seletores pelo elemento a que se referem. Também fundi achados de títulos equivalentes cuja `etapa_proposta` divergia entre personas, e nesses casos a etapa escolhida está indicada. Essa leitura é minha, não da regra literal.
- **Severidade (regra 2):** severidade máxima entre as personas, +1 quando o achado aparece em mais de uma (limite 4).
- **Limitações do ambiente**, que valem para todos os relatórios:
  - A leitura da foto e a correção são **simuladas** (`src/services/correcao.ts`): qualquer imagem vira a mesma folha de exemplo. Os agentes geraram imagens mockadas e usaram "Colar texto" para simular cada caso.
  - Não há backend, login nem persistência, que estão **fora do escopo atual** segundo o `CLAUDE.md`.
  - A revisão do professor nas fases de aluno foi simulada pelo agente, assim como as redações dos alunos nas fases de professor.
  - Os tempos vêm de automação ou de estimativa, não de uma pessoa real.

## Matriz etapa × persona (achados brutos por severidade)

| etapa | Ana Clara | Gabriel | Josiane | Márcia | Thiago |
|---|---|---|---|---|---|
| cadastro | 1×S3 | · | 1×S3 | 1×S3 1×S2 1×S1 | 1×S4 1×S2 |
| envio | 3×S4 4×S3 1×S2 | 2×S4 1×S2 | 3×S4 1×S3 2×S2 1×S1 | 1×S4 | · |
| filtro | · | 3×S3 1×S2 | 1×S4 | 1×S4 3×S3 | 2×S4 1×S3 |
| avaliador | · | 1×S2 | 1×S4 | 2×S3 | 2×S3 2×S2 |
| revisao_professor | 1×S4 | 1×S3 | · | 1×S4 1×S3 2×S2 | 3×S3 1×S2 |
| devolutiva | 2×S4 2×S3 1×S2 | 3×S3 2×S2 | 3×S4 1×S3 4×S2 | 3×S3 1×S2 | 2×S3 1×S2 |
| transversal | 1×S4 1×S3 2×S2 | 1×S3 1×S2 | 2×S3 2×S2 | 1×S4 2×S2 | 1×S3 1×S2 |

**Métricas percebidas:** nenhuma persona recomendaria a plataforma. Confiança no sistema ficou entre 1 e 2 em todas. Clareza da devolutiva: 2 (Ana Clara, Josiane, Márcia) e 3 (Gabriel, Thiago).

## Lista priorizada (achados fundidos)

Legenda de natureza:
- **[código]**: defeito real na lógica atual, corrigível já.
- **[mock]**: efeito do serviço simulado; vale como evidência para a decisão em aberto, não como bug.
- **[escopo]**: tela ou recurso ainda "Pendente" ou fora do escopo atual.
- **[produto]**: lacuna de regra ou desenho.

### Severidade 4

| # | Achado | Etapa | Personas | Origem | Natureza | Decisão |
|---|---|---|---|---|---|---|
| C-01 | Aluno abre "Visão do professor" da própria redação. Vê correção não revisada, notas e botões Aprovar/Devolver. Só abrir já muda a etapa para "Em revisão". | revisao_professor | Ana Clara, Gabriel, Josiane | A1 A-013, A2 A-010, A3 A-010 | [código] | calibracao_avaliador |
| C-02 | Comentário aprovado ou reescrito pelo professor continua rotulado "Correção automática". Sem assinatura do professor na devolutiva. | devolutiva | todas as 5 | A1 B-001, A2 A-011, A3 B-002, P1 A-112, P1 A-116, P2 A-215 | [código] | calibracao_avaliador |
| C-03 | Redação de 6 linhas com selo "risco de nota zero" é sugerida e devolvida com 520. A regra de zero não é aplicada. | filtro | Márcia | P1 A-104 | [código] | regras_nota_zero |
| C-04 | Motivo do zero não aparece em lugar nenhum: o selo da fila não diz o motivo, a revisão não mostra, e a aluna vê "0" ao lado de "Acertos 2". A aluna não é avisada do risco ao enviar. | filtro | Ana Clara, Márcia | A1 B-005, A1 A-010, P1 A-102, P1 A-105 | [código]+[produto] | regras_nota_zero |
| C-05 | Não há como zerar, anular ou reverter um zero registrando o motivo. O selo continua mesmo depois de mudar as notas. | revisao_professor | Márcia, Thiago | P1 A-107, P2 A-206 | [produto] | regras_nota_zero |
| C-06 | O nome do aluno no rodapé não é removido (a tela de envio promete) nem sinalizado como identificação, que zera no Enem. | filtro | Gabriel, Thiago | A2 A-007, A2 A-008, P2 A-204 | [código]+[produto] | regras_nota_zero, dados_alunos |
| C-07 | Cópia dos textos motivadores não é detectada, e o trecho copiado vira "acerto de repertório" (560–600). | filtro | Gabriel, Thiago | A2 A-005, P2 A-203 | [produto] | regras_nota_zero |
| C-08 | Fuga ao tema e relato pessoal são aceitos e pontuados (600 e 560). O relato ganha elogio de "tese". | filtro / avaliador | Josiane | A3 A-008, A-009, B-004, B-005 | [mock]+[produto] | regras_nota_zero |
| C-09 | Texto cortado (foto cortada, verso ausente) passa sem alerta, e a correção elogia o trecho cortado. | envio | Ana Clara, Márcia | A1 A-007, P1 A-108 | [produto] | leitura_manuscrito |
| C-10 | Só uma imagem por redação: frente e verso não são suportados e não há aviso. | envio | Josiane | A3 A-007 | [produto] | leitura_manuscrito |
| C-11 | A transcrição ignora a foto e devolve sempre o mesmo texto. Seis linhas viram 169 palavras, folha em branco vira redação inteira, e a nota é dada sobre um texto que o aluno não escreveu. | envio / devolutiva | Ana Clara, Gabriel, Josiane, Márcia | A1 A-003, A-009, A-011, B-004; A2 A-001; A3 A-003, B-003; P1 A-109 | [mock] | leitura_manuscrito |
| C-12 | Só as palavras em amarelo podem ser corrigidas. Consertar o resto exige redigitar tudo. | envio | Ana Clara, Josiane | A1 A-004, A3 A-004 | [produto] | leitura_manuscrito |
| C-13 | A foto original não aparece em nenhuma tela do professor. | revisao_professor | Márcia | P1 A-106 | [produto] | leitura_manuscrito |
| C-14 | Competências aparecem só como C1–C5. O nome existe só como dica de mouse (não aparece no toque) e não há explicação em lugar nenhum. | devolutiva | Ana Clara, Josiane | A1 B-002, A3 B-001, A3 B-007 | [código] | — |
| C-15 | Notas por competência sem justificativa própria, sem dizer o que falta para 200, e justificativas que não sustentam a nota. | avaliador | Gabriel, Márcia, Thiago | A2 A-012, P1 A-110, P2 A-209 | [produto] | calibracao_avaliador |
| C-16 | Nota alterada pelo professor não fica marcada como dele e não pede justificativa. | revisao_professor | Márcia, Thiago | P1 A-113, P2 A-208 | [produto] | calibracao_avaliador |
| C-17 | Sem prévia do que o aluno verá, sem confirmação e sem publicação em lote. | devolutiva | Márcia, Thiago | P1 A-115, P2 A-213 | [produto] | — |
| C-18 | Texto escrito com IA é pontuado normalmente (680–720), sem política visível. | filtro | Gabriel, Thiago | A2 A-006, P2 A-205 | [produto] | regras_nota_zero |
| C-19 | O mesmo texto enviado duas vezes não é sinalizado. **Ponto positivo:** as notas vieram idênticas (800/800). | filtro | Gabriel, Thiago | A2 A-004, A-014, P2 A-202 | [produto] | — |
| C-20 | Sem cadastro, idade ou consentimento do responsável para menor. O link cai logado como "Helena Campos". | cadastro | Ana Clara, Josiane | A1 A-001, A3 A-001 | [escopo] | dados_alunos |
| C-21 | Turmas, temas e motivadores não podem ser criados (Minhas turmas e Propostas estão pendentes). | cadastro | Márcia, Thiago | P1 A-001, P2 A-001 | [escopo] | regras_nota_zero |
| C-22 | Fechar a aba apaga todas as redações e o trabalho, sem aviso. | transversal | Ana Clara, Márcia | A1 A-014, P1 A-114 | [escopo] | — |
| C-23 | Listas de redações indistinguíveis (mesmo tema, mesmo nome) e status sem previsão. | transversal | Ana Clara, Josiane, Márcia | A1 A-012, A3 B-010, P1 A-101 | [código] | — |

### Severidade 3

| # | Achado | Etapa | Personas | Origem | Natureza |
|---|---|---|---|---|---|
| C-24 | Identidade fixa e confusa: aluno e professor com o nome de outra pessoa, "Visão do aluno" troca o papel global. | transversal | todas as 5 | A1 A-002, A2 A-003, P1 A-002, P2 A-002, P2 A-216 | [escopo] |
| C-25 | Papéis sem separação: menu do aluno mostra áreas de professor, instituição e equipe, e "Entrar como" fica aberto a qualquer um. | transversal | Josiane, Márcia | A3 A-002, P1 A-004 | [escopo] |
| C-26 | Jargão sem explicação: transcrição, treinar modelos, confiança, pré-aprovadas, "Automática 70%", Entidade, Bastidores. | transversal | Josiane, Márcia | A3 A-005, A3 B-006, P1 A-003, P1 A-103 | [código] |
| C-27 | Sem internet, o app confirma "Sua redação chegou" (o envio duplo foi evitado). | envio | Ana Clara | A1 A-008 | [código] |
| C-28 | Política de dados reduzida a uma frase no rodapé, sem link. | transversal | Gabriel | A2 A-009 | [produto] |
| C-29 | "Manter 'leern'" não explica a consequência, e o erro de leitura segue no texto avaliado. | envio | Josiane | A3 A-006 | [código] |
| C-30 | Não há caminho para contestar a correção. | devolutiva | Gabriel | A2 A-015 | [produto] |
| C-31 | Fila sem ações em lote nem filtro por risco de zero ou duplicidade. | revisao_professor | Thiago | P2 A-201 | [produto] |
| C-32 | Sem atalhos de teclado: 86 teclas para revisar e devolver uma redação. | revisao_professor | Thiago | P2 A-207 | [código] |
| C-33 | Sem visão da turma por competência e sem exportação de notas. | transversal | Thiago | P2 A-214 | [escopo] |

### Severidade 1 e 2 (resumo)

- Fonte em 150%: o editor de dúvida empurra o texto para fora, os botões passam da borda e a etapa "Devolvida" sai da tela (A3 A-011, A-012, B-008, B-009).
- No celular, os comentários ficam longe dos trechos (A1 B-003).
- Sem orientação de como fotografar (A1 A-005).
- Primeira carga de cerca de 65 s e 3,1 MB em 3G, medida no servidor de dev (A1 A-006).
- Confirmação de envio sem prazo (A2 A-002).
- Comentários de acerto genéricos (A2 A-013).
- Sem histórico de notas (A2 A-016).
- Pré-aprovadas fora da aba "Pendentes" (P1 A-111).
- Recado de incentivo só como marcação presa a trecho (P1 A-117).
- Sem banco de comentários (P2 A-212).
- Regra aprendida não reflete o motivo da recusa (P2 A-210).
- Nota sugerida achata no 160 (P2 A-218).

## Revisão manual obrigatória (regra 3: menor de idade em cadastro/transversal)

Ana Clara (`menor_de_idade: true`): A-001 (sem consentimento do responsável), A-002 (logada como outra pessoa, com "Entrar como Professor"), A-006 (carga em 3G), A-012 (status), A-014 (dados somem). Somem-se a eles **C-01** (a menor acessa a correção não revisada pela visão do professor) e **C-06** (nome não removido), que tocam diretamente em dado de menor, embora a etapa registrada seja outra.

## O que corrigir primeiro (código atual, sem depender de backend)

1. **C-01:** `RedacaoPage` aceita `?visao=professor` de qualquer papel, e o efeito dispara `iniciar_revisao`. Esconda o toggle para o aluno e não mude a etapa por visita. Isso quebra a invariante 1 do `CLAUDE.md`.
2. **C-02:** a devolutiva rotula pela `origem` e ignora `status: editada`. Mostre "Professor" para marcações editadas e assine a devolutiva.
3. **C-03/C-04:** quando `motivoZero` existe, as notas sugeridas devem ser zero, e o motivo deve aparecer na revisão e na devolutiva.
4. **C-06:** o filtro de identificação só remove linhas com prefixo (`Nome:`). Uma assinatura solta passa, e a tela promete o contrário.
5. **C-14:** nome da competência visível no toque, não só no `title`.
6. **C-27/C-29:** mensagem de envio sem rede, e explicação de "manter".

Os itens [mock] alimentam a decisão **leitura_manuscrito**. As quatro personas que enviaram foto viram a nota ser dada sobre um texto que não era o do aluno. O fluxo de conferência precisa permitir editar o texto inteiro (C-12) e mostrar a foto ao professor (C-13) antes de a correção real entrar.
