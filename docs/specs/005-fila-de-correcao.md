# SPEC-005: Fila de correção

- Status: Implementada
- Rota: `/#/professor/fila`
- Papel: professor

## Objetivo

Mostrar ao professor o que corrigir primeiro, com o tempo estimado do lote, sem ele precisar abrir redação por redação.

## Regras

1. Ordem padrão por `prioridade`: zero a decidir (+100), pedido de revisão aberto (+50 cada), pendentes (×3), horas desde o envio (÷6) e baixa confiança média (×20).
2. Ordens alternativas: mais antigas e menor confiança.
3. Filtros: turma e situação (a revisar, zero a decidir, devolvidas, todas). Devolvida com pedido de revisão aberto volta para "a revisar".
4. Cada item mostra aluno, data e hora, começo do texto, nota sugerida, pendentes, pré-aprovadas e os selos "zero a decidir", "texto repetido", "pedido de revisão" e número de alertas.
5. Redações devolvidas anteriormente do mesmo aluno aparecem como histórico.
6. Abrir um item leva a `/#/redacoes/<id>?visao=professor`.
7. "Devolver prontas" devolve de uma vez as redações que já podem ser devolvidas (`podeDevolverEmLote`), com confirmação que lista aluno e nota. Textos repetidos ficam de fora do lote.
8. "Exportar notas (CSV)" baixa ids da redação, do aluno e da proposta, aluno, turma, data local, se a nota é final ou sugestão, C1 a C5 e total.

## Critérios de aceite

- Dado uma redação com risco de zero, então ela é o primeiro `fila-item-*`. → `04` "ordena por prioridade"
- Dado o filtro de turma "3º B", então só itens dessa turma aparecem. → `04` "filtra por turma e por situação"
- Dado um clique no item, então a redação abre com `data-visao="professor"`. → `04` "abrir uma redação"
- Dado nenhum item no filtro, então aparece `fila-vazia`. (sem teste)
- Dado uma redação revisada, então "Devolver prontas" a devolve. → `05` "devolvidas em lote"
- Dado "Exportar notas", então o navegador baixa `notas-carcara-revisa.csv`. → `05` "exportadas em CSV"
- Dado um pedido de revisão, então o item mostra `fila-item-pedido`. → `05` "aluno pede revisão"

## data-testid principais

`fila-page`, `fila-lista`, `fila-item-<id>`, `fila-item-risco-zero`, `fila-item-pendentes`, `fila-filtro-turma`, `fila-filtro-status`, `fila-ordem`, `fila-tempo-estimado`, `fila-vazia`.

## Fora do escopo

Distribuição automática entre professores, prazos por turma, notificações, painel de desempenho da turma (tela pendente).
