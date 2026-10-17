# Specs

Comportamento esperado de cada fluxo. A spec vem antes do código: ao criar ou mudar um fluxo, atualize a spec, depois os testes e2e, depois a implementação.

| Spec | Fluxo | Testes |
| --- | --- | --- |
| [001](001-envio-e-transcricao.md) | Envio e conferência da transcrição | `02-transcricao.spec.ts` |
| [002](002-revisao-do-professor.md) | Revisão do professor | `01-fluxo-completo.spec.ts` |
| [003](003-devolutiva.md) | Devolutiva para o aluno | `03-devolutiva-filtros.spec.ts` |
| [004](004-calibragem.md) | Calibragem e regras aprendidas | `04-fila-e-navegacao.spec.ts` (bastidores) |
| [005](005-fila-de-correcao.md) | Fila de correção | `04-fila-e-navegacao.spec.ts`, `05-achados-das-personas.spec.ts` |
| [006](006-privacidade.md) | Privacidade e uso de IA | `05-achados-das-personas.spec.ts` |
| [007](007-radar-de-competencias.md) | Radar de competências na devolutiva | `06-radar-de-competencias.spec.ts` |
| [008](008-desempenho-do-professor.md) | Desempenho do professor e exportação | pendente (`07-desempenho.spec.ts`) |
| [009](009-stories.md) | Stories para Instagram | pendente (`08-stories.spec.ts`) |

## Formato

```md
# SPEC-NNN: Nome

- Status: Rascunho | Implementada | Pendente
- Rota: /#/...
- Papel: aluno | professor | instituição

## Objetivo
## Regras
## Critérios de aceite   (Dado / Quando / Então, cada um com o teste que o cobre)
## data-testid principais
## Fora do escopo
```

Critério sem teste é marcado com `(sem teste)` e vira dívida explícita.
