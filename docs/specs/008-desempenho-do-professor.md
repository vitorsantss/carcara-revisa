# SPEC-008: Desempenho do professor

- Status: Implementada (testes pendentes)
- Rota: `/#/professor/desempenho?visao=aluno&aluno=<id>` e `/#/professor/desempenho?visao=turma` (opcional `&turma=<id>`)
- Papel: professor

## Objetivo

O professor descobre em segundos quem precisa de ajuda e em qual competência a turma trava, e leva esses números para a reunião de pais ou da coordenação sem copiar nada à mão.

## Regras

1. O item "Desempenho" do menu sai do estado "Pendente de implementação".
2. Alternador Aluno/Turma (`ToggleGroup`) com o estado na URL. Sem parâmetros, abre a visão Aluno do primeiro aluno da turma com redação devolvida.
3. Seletor de turma com as turmas do professor (`turma` na URL; padrão: a primeira). Turma sem redação devolvida mostra um aviso no lugar dos gráficos.
4. Os números vêm da última versão devolvida de cada aluno na proposta atual (`desempenhoDaTurma`, que usa `historicoDoAluno` e `notasPorCompetencia`).
5. Visão Aluno:
   - seletor de aluno;
   - radar da última versão contra a média da turma (`mediaDaTurma`), com legenda;
   - última nota e a evolução desde a 1ª versão (`evolucaoTotal`);
   - linha de evolução (`LinhaEvolucao`) com o total de cada versão, rótulo só no primeiro e no último ponto e o último ponto destacado;
   - "Abaixo da turma em" com as competências abaixo da média (`competenciasAbaixoDaMedia`) ou "Acima da turma em todas as competências";
   - "Foco": a menor nota do aluno.
6. Visão Turma:
   - `GradeTurma`: aluno × C1 a C5 + total, escala de um tom só, número em cada célula, coluna da competência mais fraca com contorno e o rótulo "mais fraca", e linha de média;
   - competência mais fraca da turma (`competenciaMaisFraca` sobre a média) com sugestão de aula (`SUGESTAO_DE_AULA`, texto fixo por competência);
   - clicar no aluno abre a visão Aluno dele.
7. Excel (SheetJS, carregado com `import()` só no clique), colunas por visão (`linhasExportacao`):
   - Aluno: Aluno, Versão, C1 a C5, Total (uma linha por versão devolvida);
   - Turma: Aluno, Turma, C1 a C5, Total, Redações (uma linha por aluno).
   - Nome: `carcara-<turma>-<aaaa-mm-dd>.xlsx` (`nomeArquivoExportacao`).
8. PDF pela impressão do navegador, com layout próprio por visão:
   - Aluno: nome e turma, tema e versão, radar da última contra a anterior, nota com a diferença, evolução e 3 comentários principais;
   - Turma: turma, instituição e data, radar da média, média total, competência mais fraca, alunos em risco nela (nota até 80, `alunosEmRisco`) e a grade.
9. Só o professor da turma exporta (`podeExportar`). Toda exportação despacha `registrar_exportacao` com quem, quando, formato, visão, turma e aluno (ADR-0010). A tela mostra quantas exportações foram registradas.
10. Nenhum texto de redação aparece na tela, no Excel ou no PDF.

## Critérios de aceite

- Dado o menu "Desempenho", então a tela abre fora do estado pendente. (sem teste: `07-desempenho.spec.ts` pendente)
- Dado o alternador, quando o professor troca para Turma, então a URL ganha `visao=turma` e a grade aparece. (sem teste: `07-desempenho.spec.ts` pendente)
- Dado a visão Aluno, quando o professor escolhe outro aluno, então a URL ganha `aluno=<id>` e radar e evolução são dele. (sem teste: `07-desempenho.spec.ts` pendente)
- Dado a visão Turma, então cada aluno tem uma linha, cada célula mostra o número, a coluna mais fraca é C5 e a média aparece. (sem teste: `07-desempenho.spec.ts` pendente)
- Dado um clique no aluno da grade, então abre a visão Aluno dele. (sem teste: `07-desempenho.spec.ts` pendente)
- Dado "Excel" na visão Aluno ou Turma, então baixa `carcara-3a-<data>.xlsx` e a exportação fica registrada. (sem teste: `07-desempenho.spec.ts` pendente)
- Dado "PDF", então a impressão mostra só o relatório da visão atual. (sem teste: `07-desempenho.spec.ts` pendente)
- Regras puras `mediaDaTurma`, `competenciaMaisFraca`, `evolucaoTotal`, `competenciasAbaixoDaMedia`, `linhasExportacao`, `nomeArquivoExportacao`, `podeExportar`, `alunosEmRisco`. (sem teste: testes unitários pendentes)

## data-testid principais

`desempenho-page`, `desempenho-visao`, `desempenho-visao-aluno`, `desempenho-visao-turma`, `desempenho-turma-select`, `desempenho-aluno-select`, `desempenho-radar`, `desempenho-evolucao`, `desempenho-ultima-nota`, `desempenho-abaixo`, `desempenho-foco`, `desempenho-mais-fraca`, `grade-turma`, `grade-linha-<alunoId>`, `grade-aluno-<alunoId>`, `grade-celula-<alunoId>-c<n>`, `grade-mais-fraca`, `grade-media`, `desempenho-exportar-excel`, `desempenho-exportar-pdf`, `desempenho-exportacoes`, `desempenho-pdf-aluno`, `desempenho-pdf-turma`.

## Fora do escopo

Comparação entre turmas, filtro por período ou por proposta, mapa de erros por tipo de marcação, envio do relatório por e-mail.
