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
   A conferência abre num popup ancorado na palavra (acima dela, ou abaixo se não couber), acompanha a rolagem e fecha com Esc ou ao tocar fora.
4. **Dúvida de leitura não é erro de escrita.** O OCR nunca corrige ortografia do aluno; erro de escrita segue para a correção (C1).
5. Correções de transcrição nunca geram marcação de C1.
6. O botão de envio só fica ativo com todas as dúvidas resolvidas.
7. Ao enviar, a redação entra com `etapa = "enviada"`. Incrementar `versao` em reenvios do mesmo aluno e proposta ainda não está implementado.
8. Antes da foto: dicas de enquadramento e luz, e os textos motivadores ficam visíveis.
9. Galeria aceita várias imagens (frente e verso). Na conferência, "Adicionar verso ou outra folha" acrescenta imagens e "Ver foto" mostra as fotos ao lado do texto.
10. Foto quase uniforme (`pareceFolhaEmBranco`) pergunta "Essa foto parece estar em branco" antes de seguir.
11. "Corrigir o texto" abre o texto inteiro para edição, com o aviso de não corrigir os próprios erros de escrita.
12. Avisos antes do envio (`alertasDoTexto`), que não bloqueiam: até 7 linhas, texto cortado, cópia dos motivadores, nome ou assinatura (com "Remover a linha"), relato pessoal, fuga ao tema e texto já enviado.
13. Sem internet, o envio mostra erro e mantém o texto na tela.
14. Depois de enviar, o aluno vê os próximos passos, a previsão de devolutiva (`dataPrevistaDevolutiva`) e os pontos que o professor vai conferir.

## Critérios de aceite

- Dado a tela de envio, então câmera, galeria e colar estão visíveis. → `02` "três formas de importar"
- Dado uma folha com 3 dúvidas, quando o aluno resolve cada uma (sugestão, manter, digitar), então o resumo mostra 0 pendentes e o envio libera. → `02` "palavra duvidosa pode ser corrigida, mantida ou digitada"
- Dado uma dúvida tocada, então o popup aparece junto da palavra e fecha com Esc ou tocando fora. → `02` "conferência abre junto da palavra"
- Dado uma palavra escrita errado pelo aluno, então ela não aparece como dúvida. → `02` "erro de escrita do aluno não é tratado como dúvida"
- Dado texto colado, quando o aluno continua, então vai direto para conferência e envio. → `02` "texto colado vai direto para conferência e envio"
- Dado o envio concluído, então o professor vê a redação na fila. → `01` fluxo completo
- Dado uma assinatura no fim do texto, então aparece o aviso e "Remover a linha" a retira. → `05` "assinatura no fim do texto"
- Dado um texto que termina sem pontuação, então aparece o aviso de texto cortado. → `05` "texto que termina no meio da frase"
- Dado um relato pessoal fora do tema, então aparecem os dois avisos e o professor recebe zero sugerido. → `05` "relato pessoal fora do tema"
- Dado uma frase dos motivadores, então aluno e professor são avisados e a frase vira marcação de cópia. → `05` "cópia dos textos motivadores"
- Dado o mesmo texto enviado de novo, então aparece o aviso e o professor vê o alerta. → `05` "mesmo texto enviado de novo"
- Dado "Corrigir o texto", então o aluno edita qualquer palavra. → `05` "aluno corrige qualquer palavra"
- Dado uma foto em branco, então a plataforma pergunta antes de seguir. → `05` "foto em branco"
- Dado duas imagens, então a conferência mostra 2 folhas. → `05` "frente e verso"
- Dado o aparelho offline, então o envio avisa e o texto fica. → `05` "sem internet"
- Dado o envio concluído, então aparecem os próximos passos e a previsão. → `05` "depois de enviar"

## data-testid principais

`envio-importar-camera|galeria|colar`, `envio-usar-exemplo`, `transcricao`, `transcricao-duvida-<id>`, `duvida-sugestao-<j>`, `duvida-manter`, `duvida-input`, `duvida-ok`, `transcricao-resumo`, `envio-enviar`.

## Fora do escopo

OCR real (a leitura simulada devolve sempre a folha de exemplo), recorte e correção de perspectiva da foto, fila de envio offline.
