# SPEC-002: Revisão do professor

- Status: Implementada
- Rota: `/#/redacoes/<id>?visao=professor`
- Papel: professor

## Objetivo

O professor revisa a pré-correção como um code review: cada marcação automática é aprovada, editada ou recusada, e ele pode criar as próprias. Nada chega ao aluno sem passar por ele.

## Regras

1. Marcações automáticas entram como `pendente`, ou `pre_aprovada` quando a calibragem permite (SPEC-004).
2. Ações por card: aprovar, editar (competência, tipo, comentário), recusar com motivo, desfazer. Marcações do professor podem ser excluídas.
3. Recusa exige motivo: "Não procede", "Competência errada", "Tipo errado" ou "Comentário impreciso".
4. Selecionar um trecho na folha abre o popover de nova marcação; a seleção expande para palavras inteiras (`expandirParaPalavras`).
5. Marcação criada pelo professor com tipo diferente de acerto gera uma regra aprendida de "Omissão" (SPEC-004).
6. Nota por competência só aceita 0, 40, 80, 120, 160, 200. A nota do professor prevalece sobre a automática (`notaFinal`).
7. Divergência acima dos limites do INEP (80 por competência, 100 no total) entre nota automática e do professor é sinalizada nos bastidores (`LIMITE_INEP`).
8. "Devolver ao aluno" exige zero pendentes. Ao devolver, `etapa = "devolvida"`.
9. Alternar para a visão do aluno nunca muda o estado; só filtra o que é visível.

## Critérios de aceite

- Dado uma redação em revisão, quando o professor aprova, edita e recusa cards, então `data-status` reflete cada decisão e desfazer volta a `pendente`. → `01`
- Dado um trecho selecionado, quando o professor escolhe um tipo, então surge um card com `data-origem="professor"`. → `01`
- Dado C3 alterada para 120, então o total recalcula (760 no exemplo). → `01`
- Dado pendentes > 0, então `revisao-devolver` está desabilitado. → `01`
- Dado a visão do aluno antes da devolução, então aparece `aluno-aguardando`. → `01`
- Dado o filtro "Pendentes", então cards pré-aprovados ficam ocultos. → `01` (usa `revisao-filtro-todas`)

## data-testid principais

`revisao`, `revisao-folha`, `revisao-cards`, `card-<id>`, `card-aprovar|editar|recusar|desfazer|excluir`, `card-recusa-motivo`, `card-editor-*`, `popover-nova-marcacao`, `nova-marcacao-<tipo>`, `nota-c<c>`, `nota-total`, `revisao-devolver`, `visao-toggle`.

## Fora do escopo

Revisão por dois corretores, terceiro corretor em divergência, histórico de versões da revisão.
