---
name: regras-de-correcao
description: Use ao mexer em notas, competências, marcações, visibilidade para o aluno, calibragem ou regras aprendidas do Marca-Texto.
---

# Regras de correção

Leia antes: `docs/specs/002-revisao-do-professor.md` e `docs/specs/004-calibragem.md`. Tudo aqui vive em `src/domain/regras.ts` como função pura.

## Modelo

- Competências: C1 a C5 da matriz do ENEM.
- Tipo da marcação (cor): `acerto` (verde), `atencao` (amarelo), `erro` (vermelho). A cor nunca representa competência.
- Origem: `automatica` ou `professor`.
- Status: `pendente`, `pre_aprovada`, `aprovada`, `editada`, `recusada`.
- Notas válidas por competência: `NOTAS_VALIDAS = [0, 40, 80, 120, 160, 200]`. Total de 0 a 1000.

## Funções e o que garantem

| Função | Garante |
| --- | --- |
| `localizarTrechos` | Trecho citado que não existe no texto é descartado e contado em `marcacoesDescartadas`. |
| `visivelParaAluno` | Aluno só vê aprovada, editada, pré-aprovada ou do professor. |
| `pendentes` | Lista o que bloqueia a devolução. |
| `notaFinal` / `notaTotal` | Nota do professor prevalece sobre a automática. |
| `preAprovada` | `casos >= 30`, `taxa >= 0,95`, `confianca >= 0,8`. |
| `checagens` | Regras fixas sem IA: linhas, parágrafos, conectivos, cobertura do tema, zero por até 7 linhas. |
| `prioridade` | Ordem da fila. |
| `regraDaRecusa` | Regra genérica a partir de motivo + competência, sem trecho. |
| `regraVazaTexto` | Bloqueia regra que repita 4 palavras seguidas da redação. |

## Calibragem

- Pesos: aprovar 1, editar 0,5, recusar 0. Só marcações automáticas contam.
- Cada marcação conta uma vez: o peso somado fica em `pesoCalibragem`. Mudar a decisão ajusta pela diferença; desfazer subtrai peso e caso.
- Limites do INEP para divergência: `LIMITE_INEP` (80 por competência, 100 no total).

## Ao alterar

1. Mude a regra na função pura, nunca no componente ou no reducer.
2. Atualize a spec correspondente antes do código.
3. Se mudar um limiar, use a constante (`LIMIAR_CALIBRAGEM`, `LIMITE_INEP`); a tela de bastidores lê dela.
4. Nunca enfraqueça as invariantes 1 a 6 do `CLAUDE.md` sem um ADR.
5. Privacidade: nenhuma regra, log ou métrica pode carregar texto da redação.
