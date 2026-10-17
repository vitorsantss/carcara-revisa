# SPEC-003: Devolutiva para o aluno

- Status: Implementada
- Rota: `/#/redacoes/<id>?visao=aluno` (etapa `devolvida`)
- Papel: aluno

## Objetivo

O aluno recebe a própria folha marcada em verde, amarelo e vermelho, com comentários na margem, nota por competência e missões de reescrita. Ele entende o que acertou antes do que errou.

## Regras

1. Só aparecem marcações que passam em `visivelParaAluno` (aprovadas, editadas, pré-aprovadas ou do professor).
2. A interface não diz "IA": a origem aparece como "Correção automática" ou "Professor".
3. Comentário exibido é o editado quando existir (`comentarioVisivel`).
4. Clicar num trecho destaca o card na margem, alinhado à altura do trecho (estilo comentário do Notion).
5. Filtro por tipo (múltipla escolha) esconde trecho e comentário juntos.
6. Exportar usa a impressão do navegador e respeita o filtro aplicado.
7. Missões: até 3, das competências com menor nota final, cada uma com o próximo passo.

## Critérios de aceite

- Dado o filtro sem "erro", então nenhuma `marca-*` com `data-tipo="erro"` nem comentário correspondente fica visível. → `03` "filtro por cor"
- Dado um clique num trecho, então trecho e comentário ganham `data-active="true"`. → `03` "clicar no trecho"
- Dado uma devolutiva, então `devolutiva-missoes` lista missões. → `03` "missões de reescrita"
- Dado uma marcação recusada, então ela não aparece para o aluno. → `01`

## data-testid principais

`devolutiva`, `devolutiva-folha`, `devolutiva-margem`, `devolutiva-filtro`, `comentario-<id>`, `comentario-autor`, `devolutiva-notas`, `devolutiva-nota-c<c>`, `devolutiva-nota-total`, `devolutiva-missoes`, `missao-c<c>`, `devolutiva-exportar`.

## Fora do escopo

Reescrita guiada dentro do app, comparação entre versões, PDF gerado no servidor.
