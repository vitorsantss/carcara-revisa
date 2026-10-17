# ADR-0006: Roteamento por hash, sem biblioteca

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

O MVP precisa rodar em qualquer hospedagem estática, sem configurar rewrite de rotas, e ter URLs estáveis para testes (`/#/redacoes/r-ana?visao=professor`).

## Decisão

Um hook `useRota()` em `src/lib/router.ts` lê `location.hash`, e `navegar(path)` troca de rota. As rotas são resolvidas em `App.tsx`.

## Alternativas consideradas

- React Router ou TanStack Router: mais recursos (loaders, rotas aninhadas), mais uma dependência.

## Consequências

- Positivas: deploy estático trivial; nenhuma dependência.
- Negativas: sem rotas aninhadas, guards ou code splitting por rota.
- Ao crescer (autenticação, perfis): migrar para TanStack Router mantendo os mesmos paths.
