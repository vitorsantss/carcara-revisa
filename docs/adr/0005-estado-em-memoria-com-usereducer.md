# ADR-0005: Estado global em memória com useReducer

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

O fluxo envolve aluno e professor mexendo na mesma redação, com o toggle de visões. Não há backend no MVP.

## Decisão

Um único `AppProvider` com `useReducer` (`src/store/app-store.tsx`). Toda mudança passa por uma ação tipada (`enviar`, `decidir`, `desfazer`, `criar_marcacao`, `definir_nota`, `devolver`…). O reducer também atualiza a calibragem, garantindo que cada decisão conte uma única vez (`pesoCalibragem`).

## Alternativas consideradas

- Zustand ou Redux Toolkit: úteis com backend e cache, excessivos para o MVP.
- Estado local por tela: quebraria o toggle aluno/professor na mesma redação.

## Consequências

- Positivas: regras de transição centralizadas e fáceis de testar; zero dependências.
- Negativas: o estado some ao recarregar a página.
- Com backend: as ações viram chamadas de API (ou TanStack Query) e o reducer passa a refletir a resposta do servidor.
