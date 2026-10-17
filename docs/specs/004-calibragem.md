# SPEC-004: Calibragem e regras aprendidas

- Status: Implementada (em memória)
- Rota: `/#/bastidores`
- Papel: equipe

## Objetivo

Medir, por competência × tipo, o quanto o professor concorda com a correção automática, e usar isso para reduzir trabalho onde ela já é confiável. Aprender com recusas sem guardar texto do aluno.

## Regras

### Contagem

1. Chave: `"<competencia>|<tipo>"` (`chaveCalibragem`).
2. Peso de cada decisão: aprovar = 1, editar = 0,5, recusar = 0. `taxa = concordancia / casos`.
3. Cada marcação conta uma vez. O peso já somado fica em `pesoCalibragem`; desfazer subtrai esse peso e o caso.
4. Só marcações automáticas entram na contagem. Marcação do professor com tipo diferente de acerto gera uma regra de "Omissão" (item 8), sem mexer nos casos.

### Pré-aprovação

5. Uma marcação chega `pre_aprovada` quando `casos >= 30`, `taxa >= 0,95` e `confianca >= 0,8` (`LIMIAR_CALIBRAGEM`).
6. Pré-aprovada continua visível ao professor, que pode reverter. Ela não bloqueia a devolução.
7. Abaixo de 75% de taxa, a chave é exibida como "mais cautelosa".

### Regras aprendidas

8. Cada recusa gera uma regra genérica a partir do motivo e da competência (`regraDaRecusa`).
9. **Privacidade:** regra que repita 4 palavras seguidas da redação é bloqueada (`regraVazaTexto`). Nenhum trecho de redação entra em calibragem, regras ou logs.
10. Regras não treinam modelo. No futuro, entram como contexto do prompt (ver skill `integrar-ia`) e só com consentimento registrado.

## Critérios de aceite

- Dado uma recusa com motivo, então os bastidores mostram uma `regra-aprendida` sem trecho do texto. → `04` "bastidores registram a regra aprendida"
- Dado aprovar e desfazer a mesma marcação, então `calibragem-casos` não muda. (sem teste)
- Dado uma chave com 30 casos e 96% de taxa, então nova marcação com confiança 0,85 chega pré-aprovada. (sem teste; cobrir com teste unitário de `preAprovada`)
- Dado uma regra contendo 4 palavras seguidas do texto, então `regraVazaTexto` retorna `true`. (sem teste)

## data-testid principais

`bastidores-calibragem`, `calibragem-<c>-<tipo>`, `calibragem-casos`, `bastidores-regras`, `regra-aprendida`, `bastidores-comparacao`.

## Fora do escopo

Persistência da calibragem, calibragem por professor ou por instituição, decaimento de casos antigos.
