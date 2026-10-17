# ADR-0007: data-testid como contrato de teste

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

Os testes e2e também servem para demonstrar os fluxos. Seletores por texto ou classe CSS quebram quando o texto ou o visual muda.

## Decisão

Todo elemento interativo tem `data-testid` no formato `tela-elemento[-detalhe]`; itens de lista levam o id do registro. O estado relevante para asserções fica em atributos (`data-status`, `data-tipo`, `data-origem`, `data-etapa`, `data-visao`, `aria-pressed`). O catálogo fica em `docs/DATA-TESTID.md`.

## Alternativas consideradas

- Seletores por papel e texto acessível (`getByRole`): ótimos para acessibilidade, mas frágeis com copy em mudança durante o hackathon.

## Consequências

- Positivas: testes estáveis a mudanças de copy e de tema.
- Negativas: atributos extras no DOM; o catálogo precisa ser mantido.
- Ao estabilizar a copy: complementar com `getByRole` nos testes de acessibilidade.
