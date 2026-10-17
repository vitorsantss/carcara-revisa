# SPEC-001: Envio e conferência da transcrição

- Status: Implementada (OCR simulado)
- Rota: `/#/aluno/enviar`
- Papel: aluno

## Objetivo

O aluno fotografa a folha manuscrita, confere só as palavras que a leitura não entendeu e envia. O texto que chega à correção deve ser o que o aluno escreveu, não o que o OCR adivinhou.

## Regras

1. Três formas de importar: câmera, galeria e colar texto. Colar pula a conferência de leitura.
2. A transcrição devolve `texto` e `duvidas[]` (`lido` + `sugestoes`). Cada dúvida aparece destacada no texto.
3. Para cada dúvida o aluno pode escolher uma sugestão, manter o que foi lido ou digitar outra palavra.
4. **Dúvida de leitura não é erro de escrita.** O OCR nunca corrige ortografia do aluno; erro de escrita segue para a correção (C1).
5. Correções de transcrição nunca geram marcação de C1.
6. O botão de envio só fica ativo com todas as dúvidas resolvidas.
7. Ao enviar, a redação entra com `etapa = "enviada"`. Incrementar `versao` em reenvios do mesmo aluno e proposta ainda não está implementado.

## Critérios de aceite

- Dado a tela de envio, então câmera, galeria e colar estão visíveis. → `02` "três formas de importar"
- Dado uma folha com 3 dúvidas, quando o aluno resolve cada uma (sugestão, manter, digitar), então o resumo mostra 0 pendentes e o envio libera. → `02` "palavra duvidosa pode ser corrigida, mantida ou digitada"
- Dado uma palavra escrita errado pelo aluno, então ela não aparece como dúvida. → `02` "erro de escrita do aluno não é tratado como dúvida"
- Dado texto colado, quando o aluno continua, então vai direto para conferência e envio. → `02` "texto colado vai direto para conferência e envio"
- Dado o envio concluído, então o professor vê a redação na fila. → `01` fluxo completo

## data-testid principais

`envio-importar-camera|galeria|colar`, `envio-usar-exemplo`, `transcricao`, `transcricao-duvida-<id>`, `duvida-sugestao-<j>`, `duvida-manter`, `duvida-input`, `duvida-ok`, `transcricao-resumo`, `envio-enviar`.

## Fora do escopo

OCR real, recorte e correção de perspectiva da foto, envio offline.
