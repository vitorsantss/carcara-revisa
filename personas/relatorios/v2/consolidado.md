# Consolidação das personas, rodada 2 (2026-10-17)

Build `63146dc-dirty`, http://localhost:5173, depois das correções da rodada 1. As mesmas 5 personas rodaram em agentes isolados, com Playwright no device e na rede de cada uma, sem acesso aos relatórios anteriores. Relatórios individuais estão nesta pasta, e a rodada 1 está em `../consolidado.md`.

Mesmas regras e mesmas limitações da rodada 1:
- fusão por elemento e título equivalentes, com o seletor normalizado;
- severidade máxima +1 quando o achado aparece em mais de uma persona;
- leitura da foto simulada, estado só em memória, revisão do professor simulada pelo agente nas fases de aluno.

Nenhum achado ficou sem evidência.

## Rodada 1 × rodada 2

| | Rodada 1 | Rodada 2 |
|---|---|---|
| Achados brutos | 96 | 81 |
| Severidade 4 (bruto) | 24 | **6** |
| Severidade 3 (bruto) | 40 | 26 |
| Severidade 2 e 1 (bruto) | 32 | 49 |
| Missões que falharam | 2 (Márcia M4 e M7) | 0 |
| Recomendaria | ninguém | Gabriel, na fase 3 |
| Clareza da devolutiva (1 a 5) | 2, 3, 2, 2, 3 | 4, 4, 3, 3, 4 |
| Confiança no sistema (1 a 5) | 1 a 2 | 1 a 3 |

As 6 severidades 4 brutas que restam são de duas causas, ambas fora do código atual:
- a leitura simulada da foto (Ana Clara, Josiane e Márcia);
- fechar a aba apaga tudo (Márcia).

Os achados migraram de "não existe" e "está errado" para refinamento: textos, critérios e casos de borda.

## Matriz etapa × persona, rodada 2 (achados brutos)

| etapa | Ana Clara | Gabriel | Josiane | Márcia | Thiago |
|---|---|---|---|---|---|
| cadastro | 1×S3 | · | 1×S3 | 1×S3 2×S2 | 1×S3 |
| envio | 1×S4 2×S3 2×S2 2×S1 | 2×S3 2×S2 | 1×S4 4×S3 2×S2 | 1×S4 | · |
| filtro | · | 2×S2 | 1×S2 1×S1 | · | 2×S2 1×S1 |
| avaliador | · | · | · | 1×S3 1×S2 | 2×S3 1×S2 |
| revisao_professor | · | 1×S3 1×S2 | · | 2×S3 4×S2 | 3×S3 4×S2 |
| devolutiva | 1×S4 3×S2 1×S1 | 2×S3 1×S2 2×S1 | 1×S4 4×S2 | 1×S3 1×S2 | 1×S2 |
| transversal | 1×S3 1×S2 | · | 2×S2 | 1×S4 3×S2 | 1×S3 1×S2 1×S1 |

## O que a rodada 1 apontou e saiu da lista

- **Aluno abrindo a visão do professor:** nenhuma persona encontrou mais.
- **Regra de zero:**
  - zero sugerido com motivo, confirmado ou anulado pelo professor (reverter custa 1 clique);
  - devolução bloqueada até a decisão;
  - o aluno lê o motivo e como evitar.

  A Márcia concluiu M3 e M4, que tinham falhado.
- **Cópia dos motivadores e assinatura:** detectadas, e o Thiago confirmou. Fuga ao tema e relato pessoal geram aviso antes do envio, e a Josiane entendeu.
- **Devolutiva:**
  - competências com nome, explicação, "por que" e "para chegar a 200";
  - assinatura do professor e recado;
  - glossário;
  - pedido de revisão (Gabriel concluiu M9).
- **Revisão:**
  - foto original;
  - nota alterada registrada com justificativa;
  - prévia do que o aluno recebe e confirmação antes de devolver;
  - atalhos J/K/A/R/E (o Thiago estimou 4 a 5 min por redação, contra 8 a 10).
- **Outros:** devolução em lote, CSV, filtro "zero a decidir", aviso sem internet, previsão de devolutiva, página de privacidade e IA, frente e verso, edição do texto inteiro.

## Lista priorizada, rodada 2 (achados fundidos)

Natureza: **[código]** corrigível já · **[mock]** efeito da simulação · **[escopo]** fora do escopo atual · **[produto]** regra ou desenho a decidir.

### Severidade 4

| # | Achado | Personas | Origem | Natureza |
|---|---|---|---|---|
| V-01 | A leitura da foto devolve sempre a mesma redação, e a nota (760 a 800) sai sobre um texto que o aluno não escreveu. | Ana Clara, Gabriel, Josiane, Márcia | A1 A-103, A-301; A2 A-101; A3 A-003, A-101; P1 A-001 | [mock] |
| V-02 | Comentário pré-aprovado pela calibragem aparece ao aluno como "aprovado pelo professor". Repetido em todo comentário, o rótulo faz duvidar de que o professor leu. | Ana Clara, Gabriel, Márcia | A1 A-303, A2 A-301, P1 A-004 | [código] |
| V-03 | O mesmo texto do mesmo aluno foi devolvido com 760 e 800, sem conciliação. "Devolver prontas" devolveu a repetida sem alerta. | Gabriel, Thiago | A2 A-303, P2 A-005 | [código] |
| V-04 | Com o zero confirmado, ainda é preciso aprovar as marcações para poder devolver. | Márcia, Thiago | P1 A-006, P2 A-003 | [produto]: invariante 4 |
| V-05 | A detecção de assinatura é frágil: só pega o nome exato da conta, e a assinatura dispara um falso "texto incompleto". | Gabriel, Thiago | A2 A-102, A-103, P2 A-009 | [código] |
| V-06 | Sem cadastro, idade ou consentimento do responsável; sem turmas, temas e duas escolas. | Ana Clara, Josiane, Márcia, Thiago | A1 A-101, A3 A-001, P1 F0-001, P2 A-001 | [escopo] |
| V-07 | Fechar a aba apaga tudo, inclusive devolutivas já enviadas. | Márcia | P1 A-002 | [escopo]: ADR-0005 |

### Severidade 3

| # | Achado | Personas | Origem | Natureza |
|---|---|---|---|---|
| V-08 | A devolutiva de zero mistura o motivo com acertos verdes, missões genéricas e cinco "pedir revisão". | Ana Clara, Josiane, Márcia | A1 A-304, A3 A-104, P1 A-007 | [código] |
| V-09 | Jargão sem explicação: certeza 55%, pré-aprovadas, repertório legitimado, edital, termos de programador nas telas "em breve". | Ana Clara, Josiane, Márcia | A1 A-306, A3 A-002, A-102, P1 A-010, F0-002 | [código] |
| V-10 | A mensagem sobre o zero escrita depois de "Confirmar zero" é descartada sem aviso. | Márcia | P1 A-003 | [código] |
| V-11 | Comentários automáticos dirigidos ao professor ("Confira se…") chegam ao aluno. | Márcia | P1 A-005 | [código] |
| V-12 | Com fonte 150%: a conferência rola para o lado e o popup da palavra corta o OK, o que bloqueia o envio. | Josiane | A3 A-010, A-011 | [código] |
| V-13 | C5 com "3 dos 5 elementos" recebe 160; pela grade seriam 120. | Thiago | P2 A-006 | [código] |
| V-14 | Uma foto de seis linhas é tratada como "em branco" e, ao continuar, o aviso de zero some. | Ana Clara | A1 A-108 | [código]+[mock] |
| V-15 | Foto torta e cortada aceita sem aviso (o aviso só vale para o texto lido). | Ana Clara | A1 A-106 | [mock] |
| V-16 | A foto original fica acima do texto, não ao lado, e não amplia em 1366×768. | Márcia | P1 A-008 | [código] |
| V-17 | Quando a leitura falha, a saída é reescrever tudo no celular. "Palavras conferidas por você" soa como se o texto estivesse certo. | Josiane | A3 A-004, A-005 | [mock]+[código] |
| V-18 | O professor só zera quando o sistema sugere, e não registra motivo próprio. | Thiago | P2 A-007 | [produto] |
| V-19 | Não há como sinalizar de forma estruturada uma justificativa de nota ruim. | Thiago | P2 A-011 | [produto] |
| V-20 | Nota rebaixada pelo professor sem nenhum trecho que a sustente. | Gabriel | A2 A-302 | [produto] |
| V-21 | Cerca de 70 s de tela branca no 3G (servidor de dev, sem build de produção). | Ana Clara | A1 A-102 | [código]: medir em produção |
| V-22 | Sem visão de desempenho da turma. | Thiago | P2 A-016 | [escopo] |

### Severidade 2 e 1 (resumo)

**Defeitos de código:**
- Fila mostra "falta decidir o zero" numa redação com pedido de revisão (A2 A-305).
- "(nota definida pelo professor)" aparece sem espaço (A2 A-306).
- Marcação corta palavra ao meio, "as rede|s" (P1 A-009).
- Seleção sobre trecho já marcado não avisa (P2 A-014).
- Alvos de toque pequenos na devolutiva e na conferência (A1 A-104, A-302).
- Aviso de "sem internet" não some quando a rede volta (A1 A-107).

**Lacunas e fricções:**
- O aviso de cópia não diz quais frases (A2 A-106).
- Sem registro de suspeita de IA privado ao professor (P2 A-008).
- Atalhos não cobrem nota, prévia e próxima (P2 A-010).
- CSV sem id do aluno e com data em UTC (P2 A-017).
- Lote sem resumo (P2 A-015).
- Sem banco de comentários (P2 A-013).
- Sem histórico de notas (A2 A-307).
- O glossário só existe dentro da devolutiva (A3 A-105).

**Efeito da simulação:** "Você já enviou este texto" numa redação nova (A3 A-007) e o verso que não muda o texto lido (A3 A-006).

## Revisão manual obrigatória (regra 3, Ana Clara, menor de idade)

- A-101 (cadastro): sem verificação de idade nem consentimento.
- A-102 (transversal): carga lenta.
- A-112 (transversal): mostra o nome de outra aluna.

Nenhum achado indica exposição de dado de menor a terceiros, e o acesso à visão do professor, que pesou na rodada 1, não apareceu.

## Próximos passos sugeridos

1. **Código, rápido:**
   - V-02: rótulo da pré-aprovação;
   - V-03: alerta de repetida no lote e comparação das notas;
   - V-05: assinatura com o primeiro nome e sobrenome do aluno, sem disparar "incompleto";
   - V-08: devolutiva de zero enxuta;
   - V-10: salvar a mensagem do zero ao sair do campo;
   - V-11: reescrever os comentários heurísticos para o aluno;
   - V-12: fonte 150%;
   - V-13: grade da C5;
   - V-16: foto ao lado e com zoom;
   - defeitos de severidade 2.
2. **Decisão de produto:**
   - V-04: liberar a devolução com zero confirmado mexe na invariante 4 e pede ADR;
   - V-18 e V-19: zerar por motivo próprio e sinalizar justificativa ruim.
3. **Fora do escopo atual:**
   - leitura real da foto (V-01, V-15, V-17), pela skill `integrar-ia`;
   - persistência (V-07);
   - cadastro, consentimento e turmas (V-06);
   - painel da turma (V-22).
