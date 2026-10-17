# SPEC-003: Devolutiva para o aluno

- Status: Implementada
- Rota: `/#/redacoes/<id>?visao=aluno` (etapa `devolvida`)
- Papel: aluno

## Objetivo

O aluno recebe a própria folha marcada em verde, amarelo e vermelho, com comentários na margem, nota por competência e missões de reescrita. Ele entende o que acertou antes do que errou.

## Regras

1. Só aparecem marcações que passam em `visivelParaAluno` (aprovadas, editadas, pré-aprovadas ou do professor).
2. A interface não diz "IA". Cada comentário mostra quem responde por ele (`autoria`): "Escrito pelo professor", "Ajustado pelo professor", "Sugestão aprovada pelo professor" ou, na pré-aprovação pela calibragem, "Sugestão aceita automaticamente: o professor confia neste tipo de correção". Pré-aprovada nunca aparece como decisão do professor.
3. Comentário exibido é o editado quando existir (`comentarioVisivel`).
4. Clicar num trecho destaca o card na margem, alinhado à altura do trecho (estilo comentário do Notion).
5. Filtro por tipo (múltipla escolha) esconde trecho e comentário juntos.
6. Exportar usa a impressão do navegador e respeita o filtro aplicado.
7. Missões: até 3, das competências com menor nota final, cada uma com o próximo passo.
8. Assinatura "Corrigida e assinada por Prof. …" com a data da devolução, e o recado do professor quando houver.
9. Com zero valendo: bloco "Por que a nota foi zero" com o motivo, a mensagem do professor e "Como evitar na próxima" (`comoEvitarZero`). Sem detalhamento por competência nem missões de reescrita; no lugar, um único "Pedir revisão do zero".
10. Cada competência aparece com o nome, uma explicação simples, "Por que <nota>" (justificativa do professor quando ele mudou a nota, senão a automática) e "Para chegar a <nota+40>".
11. "O que são as 5 competências?" explica a matriz em linguagem simples.
12. Por competência, o aluno pode pedir revisão com uma mensagem, e recebe a confirmação na hora.
13. Na prévia do professor (`previa`), a devolutiva aparece igual, sem exportar nem pedir revisão.

## Critérios de aceite

- Dado o filtro sem "erro", então nenhuma `marca-*` com `data-tipo="erro"` nem comentário correspondente fica visível. → `03` "filtro por cor"
- Dado um clique num trecho, então trecho e comentário ganham `data-active="true"`. → `03` "clicar no trecho"
- Dado uma devolutiva, então `devolutiva-missoes` lista missões. → `03` "missões de reescrita"
- Dado uma marcação recusada, então ela não aparece para o aluno. → `01`
- Dado a devolutiva, então aparece a assinatura do professor e um comentário com autoria "professor". → `01`
- Dado zero confirmado, então aparecem motivo, mensagem e como evitar. → `05` "zero sugerido bloqueia a devolução"
- Dado nota alterada, então a justificativa do professor aparece na competência. → `05` "nota alterada fica registrada"
- Dado um pedido de revisão, então a confirmação aparece. → `05` "aluno pede revisão"

## data-testid principais

`devolutiva`, `devolutiva-folha`, `devolutiva-margem`, `devolutiva-filtro`, `comentario-<id>`, `comentario-autor`, `devolutiva-notas`, `devolutiva-nota-c<c>`, `devolutiva-nota-total`, `devolutiva-missoes`, `missao-c<c>`, `devolutiva-exportar`.

## Fora do escopo

Reescrita guiada dentro do app, comparação entre versões, histórico de notas por competência, PDF gerado no servidor.
