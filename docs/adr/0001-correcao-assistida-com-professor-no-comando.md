# ADR-0001: Correção assistida, com o professor no comando

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

O case pede devolutiva rápida, alinhada às 5 competências, que apoie o corretor sem substituí-lo. Avaliação automática erra, principalmente em C2 e C3, que são subjetivas. A banca e as escolas vão perguntar quem responde pela nota.

## Decisão

A correção automática é uma **pré-correção**. Ela propõe marcações com trecho, competência, tipo e confiança. Nada chega ao aluno sem aprovação, edição ou criação pelo professor, e a nota final é sempre a dele.

## Alternativas consideradas

- Nota 100% automática: mais rápida, mas sem responsável e contrária ao case.
- IA só como assistente de chat para o professor: não reduz o tempo de correção de forma mensurável.

## Consequências

- Positivas: responsabilidade clara; o professor ensina o sistema a cada decisão (ADR-0002).
- Negativas: o tempo de correção não cai a zero; a fila depende da disponibilidade do professor.
- Se revista: só faria sentido com evidência de concordância muito alta por competência, medida contra notas humanas.
