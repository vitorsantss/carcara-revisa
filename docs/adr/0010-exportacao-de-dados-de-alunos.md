# ADR-0010: Exportação de dados de alunos

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

O painel de desempenho (SPEC-008) exporta Excel e PDF com notas de alunos, quase todos menores de idade. Um arquivo exportado sai do controle da plataforma: pode ir para um grupo de mensagens, um e-mail errado ou um pendrive. A LGPD pede finalidade clara, mínimo de dados e rastreabilidade.

## Decisão

1. **Só o professor da turma exporta.** `podeExportar(professor, turmaId)` exige que a turma esteja em `professor.turmaIds`. O botão fica desabilitado para os outros, e o reducer recusa o registro.
2. **Nunca texto de redação.** As colunas saem de `linhasExportacao` e levam só nome do aluno, turma, versão, notas C1 a C5, total e quantidade de redações. O PDF mostra gráficos, números e comentários do professor, nunca trechos do texto.
3. **Cada exportação fica registrada no estado** pela ação `registrar_exportacao`: quem (`professorId`), quando (`quando`, ISO), o quê (`formato`, `visao`, `turmaId` e, na visão Aluno, `alunoId`). O registro não guarda o conteúdo do arquivo.

## Alternativas consideradas

- Exportar o CSV completo já existente na fila: inclui todas as turmas e não registra quem exportou.
- Gerar o arquivo no servidor com link temporário: mais seguro, mas o MVP não tem backend (ADR-0005).

## Consequências

- Positivas: dá para responder "quem tirou estes dados daqui e quando"; o arquivo não carrega a produção do aluno.
- Negativas e custos: o registro vive em memória e some ao recarregar, como todo o estado do MVP. Com backend, ele precisa ir para um log de auditoria persistente e imutável.
- O que precisa mudar se a decisão for revista: `podeExportar`, `linhasExportacao` e a ação `registrar_exportacao`; os testes `07` "Excel da visão Aluno/Turma" (pendentes) devem verificar o registro.
