# ADR-0003: IA atrás de interfaces de serviço, simulada no MVP

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

O MVP precisa funcionar ao vivo no pitch, sem depender de internet ou chave de API, e os testes e2e precisam de resultados determinísticos.

## Decisão

Transcrição e correção ficam atrás das interfaces `ServicoTranscricao` e `ServicoCorrecao` (`src/services/correcao.ts`). No MVP, as implementações são simuladas: a folha de exemplo tem gabarito e outros textos usam heurísticas. A saída da IA real deve obedecer aos mesmos tipos (`ResultadoTranscricao`, `ResultadoCorrecao`).

## Alternativas consideradas

- Chamar a API de IA direto do front: expõe chave e torna os testes instáveis.
- Mock só nos testes: a demo ao vivo ficaria dependente de rede.

## Consequências

- Positivas: demo offline; testes estáveis; troca por backend real sem mexer nas telas.
- Negativas: as heurísticas não representam a qualidade real da correção.
- Ao integrar: ver a skill `integrar-ia`. O backend valida o JSON e o front continua descartando trechos inexistentes.
