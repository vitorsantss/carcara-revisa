# SPEC-005: Fila de correção

- Status: Implementada
- Rota: `/#/professor/fila`
- Papel: professor

## Objetivo

Mostrar ao professor o que corrigir primeiro, com o tempo estimado do lote, sem ele precisar abrir redação por redação.

## Regras

1. Ordem padrão por `prioridade`: risco de nota zero (+100), pendentes (×3), horas desde o envio (÷6) e baixa confiança média (×20).
2. Ordens alternativas: mais antigas e menor confiança.
3. Filtros: turma e situação (a revisar, devolvidas, todas).
4. Cada item mostra aluno, nota automática, pendentes, pré-aprovadas e o selo de risco de zero quando houver `motivoZero`.
5. Redações devolvidas anteriormente do mesmo aluno aparecem como histórico.
6. Abrir um item leva a `/#/redacoes/<id>?visao=professor`.

## Critérios de aceite

- Dado uma redação com risco de zero, então ela é o primeiro `fila-item-*`. → `04` "ordena por prioridade"
- Dado o filtro de turma "3º B", então só itens dessa turma aparecem. → `04` "filtra por turma e por situação"
- Dado um clique no item, então a redação abre com `data-visao="professor"`. → `04` "abrir uma redação"
- Dado nenhum item no filtro, então aparece `fila-vazia`. (sem teste)

## data-testid principais

`fila-page`, `fila-lista`, `fila-item-<id>`, `fila-item-risco-zero`, `fila-item-pendentes`, `fila-filtro-turma`, `fila-filtro-status`, `fila-ordem`, `fila-tempo-estimado`, `fila-vazia`.

## Fora do escopo

Distribuição automática entre professores, prazos por turma, notificações.
