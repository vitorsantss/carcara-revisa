# Contrato de saída dos agentes

Todo agente de persona devolve exatamente dois artefatos ao final da fase: um JSON para o orquestrador agregar e um markdown curto para leitura humana. O formato é único para que achados de personas diferentes possam ser comparados e deduplicados.

## 1. JSON (`relatorios/<persona-id>-fase-<n>.json`)

```json
{
  "persona_id": "aluno-01-ana-clara",
  "fase": 1,
  "executado_em": "2026-10-17T21:40:00-03:00",
  "ambiente": {
    "url_base": "https://staging.exemplo",
    "device": "Moto G4",
    "rede": "3g-instavel",
    "build": "abc1234"
  },
  "missoes": [
    {
      "id": "M2",
      "status": "concluida",
      "duracao_segundos": 214,
      "interacoes": 17,
      "abandono_em": null,
      "falas": [
        "Pera, carregou ou não carregou?"
      ],
      "achados": ["A-003", "A-004"]
    }
  ],
  "achados": [
    {
      "id": "A-003",
      "missao": "M2",
      "etapa_proposta": "envio",
      "tipo": "friccao",
      "severidade": 3,
      "titulo": "Upload sem indicador de progresso em rede lenta",
      "o_que_aconteceu": "Após tocar em enviar, a tela ficou parada por 11 segundos sem retorno visual.",
      "o_que_a_persona_esperava": "Uma barra ou mensagem dizendo que a foto estava sendo enviada.",
      "impacto": "A persona tocou de novo e gerou envio duplicado.",
      "passos": [
        "Abrir /redacoes/nova",
        "Selecionar foto-noite-luz-amarela.jpg",
        "Tocar no botão 'Enviar redação'"
      ],
      "evidencias": [
        "capturas/aluno-01/M2-passo3.png",
        "capturas/aluno-01/M2-passo4.png"
      ],
      "seletor_visivel": "role=button[name='Enviar redação']",
      "relacionado_a_decisao_em_aberto": null
    }
  ],
  "metricas_percebidas": {
    "confianca_no_sistema": 2,
    "clareza_da_devolutiva": null,
    "recomendaria": false
  },
  "cenarios_nao_executados": [
    { "missao": "M6", "motivo": "fixture folha-em-branco.jpg ausente" }
  ]
}
```

### Campos com valores fechados

**`tipo`**
- `defeito`: o sistema fez algo errado ou diferente do especificado.
- `friccao`: funcionou, mas custou tempo, esforço ou tentativa extra à persona.
- `percepcao`: funcionou, mas a persona não entendeu, desconfiou ou se sentiu mal.
- `lacuna`: a proposta ou o produto não cobre um caso real (por exemplo, regra de nota zero ausente).

**`severidade`** (escala de Nielsen)
- `0`: não é problema.
- `1`: cosmético; corrigir se sobrar tempo.
- `2`: menor; baixa prioridade.
- `3`: maior; prioridade alta, afeta conclusão da tarefa ou confiança.
- `4`: catastrófico; impede a tarefa, perde dado do usuário, expõe dado de menor, ou gera nota injusta.

**`etapa_proposta`**: `cadastro`, `envio`, `filtro`, `avaliador`, `revisao_professor`, `devolutiva`, `transversal`.

**`relacionado_a_decisao_em_aberto`**: `leitura_manuscrito`, `regras_nota_zero`, `calibracao_avaliador`, `dados_alunos`, ou `null`. Liga o achado diretamente ao slide "Decisões em aberto" da proposta.

**`metricas_percebidas`**: de 1 a 5, na voz da persona. `null` quando a fase não permite avaliar.

## 2. Markdown (`relatorios/<persona-id>-fase-<n>.md`)

No máximo uma página, na voz da persona, nesta ordem:

```markdown
# <Nome da persona>, fase <n>

## Em uma frase
<O que a persona diria a um amigo sobre a plataforma.>

## O que funcionou
<Até três itens.>

## O que travou
<Os achados de severidade 3 e 4, com o id de cada um.>

## O que eu não entendi
<Termos e telas que geraram dúvida.>

## Eu voltaria a usar?
<Sim ou não, e por quê.>
```

## Regras de consolidação (orquestrador)

1. Achados de personas diferentes com mesmo `etapa_proposta`, mesmo `seletor_visivel` e títulos semanticamente equivalentes são fundidos. O achado fundido guarda a lista de personas afetadas.
2. Achado que aparece em mais de uma persona sobe um ponto de severidade (limite 4). Problema que afeta a Ana Clara e a Márcia ao mesmo tempo atinge os dois lados do fluxo.
3. Qualquer achado envolvendo dado de menor de idade (persona com `menor_de_idade: true`) e `etapa_proposta` igual a `cadastro` ou `transversal` é revisado manualmente, independente da severidade.
4. Achados sem evidência são descartados e listados à parte como "não verificados".
5. A saída final é uma matriz `etapa_proposta` x `persona`, com contagem de achados por severidade, mais a lista priorizada.