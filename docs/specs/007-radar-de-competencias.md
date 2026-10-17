# SPEC-007: Radar de competências na devolutiva

- Status: Rascunho
- Rota: `/#/redacoes/<id>?visao=aluno` (etapa `devolvida`)
- Papel: aluno

## Objetivo

Ao abrir a devolutiva, o aluno vê de relance em que competência avançou desde a versão anterior e onde deve focar agora, sem precisar comparar números de duas telas.

## Regras

1. Ao lado das notas, o card "Suas competências" mostra: nota total da versão, diferença para a versão anterior (`+N`, `-N` ou `0`), legenda, radar, notas de C1 a C5 e as frases "Avançou" e "Foco agora".
2. Versão anterior é a maior versão **devolvida** do mesmo aluno, na mesma proposta, menor que a atual (`versaoAnterior`). As notas vêm de `notasPorCompetencia`, que usa `notaFinal`.
3. Radar (`RadarCompetencias`): grade de 0 a 200 em passos de 40. A série atual tem preenchimento leve e pontos que mostram "C<n> <nome>: <nota>" ao passar o mouse; a anterior é tracejada e sem preenchimento. No máximo 2 séries.
4. `insightsDeEvolucao(atual, anterior)` devolve `{ avanco, ganho, foco }`:
   - `avanco`: competência com o maior ganho positivo sobre a anterior (empate: a de menor número). Sem ganho positivo ou sem anterior, `null`.
   - `foco`: competência com a menor nota atual (empate: a de menor número).
5. Sem versão anterior: só a série atual, sem diferença e só "Foco agora".
6. Com zero valendo, o card não aparece: todas as notas são 0 e o bloco "Por que a nota foi zero" já explica o que fazer.
7. "Baixar PDF" chama `window.print()` com o layout de resumo: radar, nota, evolução (linha com o total de cada versão devolvida até esta) e 3 comentários principais (`comentariosPrincipais`: um acerto, um erro e uma atenção, nessa ordem, completando pela ordem do texto). O resto da página fica escondido. "Exportar folha" continua imprimindo a folha marcada.
8. Na prévia do professor o card aparece igual, sem "Baixar PDF" e sem "Compartilhar".
9. Acessibilidade: o gráfico tem `role="img"` e `aria-label` com os valores; a legenda e as notas aparecem em texto, então a informação não depende só da cor.

## Critérios de aceite

- Dado a versão 3 devolvida de Helena, então o radar mostra a série atual e a anterior, nota 680 e diferença +40. → `06` "radar compara a versão atual com a anterior"
- Dado um ganho em C1, então "Avançou" cita C1 (+40) e "Foco agora" cita a menor nota (C3). → `06` "radar compara a versão atual com a anterior"
- Dado a primeira versão, então só a série atual e só "Foco agora" aparecem. → `06` "primeira versão mostra só a série atual e o foco"
- Dado "Baixar PDF", então na impressão só o resumo fica visível. → `06` "Baixar PDF imprime só o resumo"
- Dado uma nova versão enviada, revisada e devolvida, então a devolutiva compara com a versão anterior. → `06` "nova versão devolvida compara com a anterior"
- Dado a prévia do professor, então o radar aparece sem exportar nem compartilhar. → `06` "prévia do professor mostra o radar sem exportar nem compartilhar"
- Regras puras `insightsDeEvolucao`, `versaoAnterior` e `comentariosPrincipais`. → `src/domain/regras.test.ts`

## data-testid principais

`radar-competencias`, `radar-serie-atual`, `radar-serie-anterior`, `radar-nota-total`, `radar-delta`, `radar-avanco`, `radar-foco`, `radar-exportar-pdf`, `devolutiva-compartilhar`, `radar-resumo-impressao`.

## Fora do escopo

Comparação entre propostas diferentes, PDF gerado no servidor.
