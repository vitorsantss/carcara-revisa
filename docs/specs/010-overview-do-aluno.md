# SPEC-010: Overview do aluno

- Status: Implementada
- Rota: `/#/aluno/desempenho` (aluno logado) e `/#/professor/alunos/<alunoId>` (professor)
- Papel: aluno | professor

## Objetivo

Ver o desempenho geral de um aluno numa tela só, sem abrir redação por redação: nota atual, evolução, onde está forte, onde focar e as notas de cada versão devolvida.

## Regras

1. Um único componente (`OverviewAluno`) serve as duas rotas. O que muda entre elas é o link de cada versão (`?visao=aluno` ou `?visao=professor`).
2. Aluno: item "Meu desempenho" no menu do aluno, sempre com o aluno logado (`USUARIO_ALUNO`).
3. Professor: abre pelo botão "Ver overview" na visão Aluno de Desempenho. A grade da turma continua abrindo a visão Aluno de Desempenho (SPEC-008). O professor só vê alunos das próprias turmas (`podeVerAluno`); aluno desconhecido ou de outra turma mostra um aviso.
4. Os números vêm de `overviewDoAluno`, sobre as versões **devolvidas** do aluno na proposta atual (`historicoDoAluno`), com `notaFinal`. Assim o overview e Desempenho → Aluno mostram a mesma nota.
5. Redação enviada ou em revisão conta só como "em andamento": a nota sugerida nunca aparece no overview.
6. Conteúdo:
   - cabeçalho com nome, turma e tema;
   - indicadores: última nota, evolução desde a 1ª versão (`evolucaoTotal`), melhor nota, redações devolvidas e em andamento;
   - radar da última versão contra a primeira, com legenda (só a última se houver uma versão);
   - linha de evolução (`LinhaEvolucao`) com o total de cada versão;
   - por competência (C1 a C5): nota atual, diferença desde a 1ª e quantos erros e atenções visíveis ao aluno (`visivelParaAluno`) apareceram em todas as versões;
   - "Mais forte" (`melhorCompetencia`), "Mais avançou" (maior ganho desde a 1ª, se houver) e "Foco agora" (`competenciaMaisFraca`);
   - tabela das versões: versão, data de devolução, C1 a C5, total e link para a redação.
7. Sem versão devolvida, os gráficos dão lugar a um aviso; as redações em andamento continuam contadas.
8. Nenhum texto de redação nem trecho de marcação aparece na tela.

## Critérios de aceite

- Dado o menu do aluno, quando ele toca em "Meu desempenho", então vê o overview de Helena com última nota 760, evolução +200, 4 devolvidas e 0 em andamento. → `09` "aluno abre o próprio overview pelo menu"
- Dado o overview de Helena, então o radar mostra a última (160,160,120,160,160) contra a primeira, mais forte C1, mais avançou C4 (+80) e foco C3. → `09` "overview resume competências e evolução"
- Dado a tabela de versões, quando o aluno toca numa versão, então abre a devolutiva dela na visão do aluno. → `09` "tabela de versões abre a redação"
- Dado uma redação nova enviada e ainda não devolvida, então ela conta como em andamento e a última nota continua 760. → `09` "redação em revisão não muda a nota do overview"
- Dado Desempenho → Aluno, quando o professor toca em "Ver overview", então abre `/professor/alunos/<id>` com a mesma última nota e links na visão do professor. → `09` "professor abre o overview a partir de Desempenho"
- Dado um aluno sem versão devolvida, então aparece o aviso e a contagem em andamento. → `09` "aluno sem devolvida mostra aviso"
- Dado um id de aluno desconhecido, então aparece "Aluno não encontrado". → `09` "aluno desconhecido mostra aviso"
- Regras puras `overviewDoAluno` e `podeVerAluno`. (sem teste: testes unitários pendentes)

## data-testid principais

`overview-aluno`, `overview-nao-encontrado`, `overview-vazio`, `overview-ultima-nota`, `overview-evolucao-total`, `overview-melhor-nota`, `overview-devolvidas`, `overview-em-andamento`, `overview-radar`, `overview-serie-ultima`, `overview-serie-primeira`, `overview-evolucao`, `overview-competencia-c<n>`, `overview-mais-forte`, `overview-avanco`, `overview-foco`, `overview-versoes`, `overview-versao-<redacaoId>`, `desempenho-abrir-overview`, `nav-aluno-desempenho`.

## Fora do escopo

Comparação entre propostas, comparação com a média da turma (fica em Desempenho), exportação do overview.
