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
8. "Devolver ao aluno" exige zero pendentes e, havendo zero sugerido, a decisão do professor (`podeDevolver`). A devolução pede confirmação na própria tela, mostrando nota, número de comentários e assinatura. Ao devolver, `etapa = "devolvida"`, com `revisorId` e `devolvidaEm`.
9. A visão segue o papel atual (seletor "Entrar como"). O aluno não tem acesso à revisão. O professor confere o que o aluno vai receber em "Ver como o aluno recebe" (prévia), sem mudar o estado.
10. Zero sugerido (ADR-0009): painel com o motivo, "Confirmar zero" e "Anular zero e avaliar normalmente", com mensagem opcional ao aluno, salva ao sair do campo (antes ou depois de decidir). Enquanto o zero vale, as notas ficam em 0 e travadas.
11. Alertas do texto (cópia, identificação, texto cortado, repetido, relato, fuga ao tema) aparecem antes da folha, sem trecho da redação.
12. "Ver foto original" abre as fotos ao lado do texto, no lugar das correções, com "Ampliar". Selecionar um trecho que já tem marcação explica o que fazer em vez de abrir o menu de nova marcação.
13. "Notas por competência" mostra a sugestão automática com justificativa. Nota alterada aparece como "Você mudou de X para Y", com campo de justificativa que o aluno lê.
14. Recado para o aluno, opcional, aparece no topo da devolutiva com a assinatura.
15. Atalhos: J/K próxima/anterior, A aprovar, R recusar, E editar, P prévia, D devolver, ignorados enquanto se digita.
17. Redação repetida mostra a comparação das notas com a outra, competência por competência.
16. Pedido de revisão do aluno aparece no topo. Com a redação devolvida, "Reabrir para revisão" volta a etapa para `em_revisao`.

## Critérios de aceite

- Dado uma redação em revisão, quando o professor aprova, edita e recusa cards, então `data-status` reflete cada decisão e desfazer volta a `pendente`. → `01`
- Dado um trecho selecionado, quando o professor escolhe um tipo, então surge um card com `data-origem="professor"`. → `01`
- Dado C3 alterada para 120, então o total recalcula (760 no exemplo). → `01`
- Dado pendentes > 0, então `revisao-devolver` está desabilitado. → `01`
- Dado a visão do aluno antes da devolução, então aparece `aluno-aguardando`. → `01`
- Dado o filtro "Pendentes", então cards pré-aprovados ficam ocultos. → `01` (usa `revisao-filtro-todas`)
- Dado o aluno numa redação, então não há seletor de visão nem revisão. → `01`
- Dado zero sugerido, então devolver fica bloqueado até confirmar ou anular, e o aluno lê motivo, mensagem e como evitar. → `05` "zero sugerido bloqueia a devolução"
- Dado o zero anulado, então as notas voltam a ser editáveis. → `05` "anular o zero"
- Dado nota alterada com justificativa e recado, então a prévia e a devolutiva mostram ambos. → `05` "nota alterada fica registrada"
- Dado J e depois A, então o primeiro card pendente é aprovado. → `05` "atalhos de teclado"
- Dado um pedido de revisão, então a fila sinaliza e o professor reabre. → `05` "aluno pede revisão"

## data-testid principais

`revisao`, `revisao-folha`, `revisao-cards`, `card-<id>`, `card-aprovar|editar|recusar|desfazer|excluir`, `card-recusa-motivo`, `card-editor-*`, `popover-nova-marcacao`, `nova-marcacao-<tipo>`, `nota-c<c>`, `nota-total`, `revisao-devolver`, `revisao-devolver-confirmar`, `revisao-previa`, `revisao-zero`, `revisao-alertas`, `revisao-notas-detalhe`, `revisao-recado`, `revisao-pedidos`, `revisao-reabrir`.

## Fora do escopo

Revisão por dois corretores, terceiro corretor em divergência, histórico de versões da revisão, banco de comentários reutilizáveis, salvamento entre sessões.
