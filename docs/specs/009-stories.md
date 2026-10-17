# SPEC-009: Stories para Instagram

- Status: Implementada (testes pendentes)
- Rota: diálogo aberto por `devolutiva-compartilhar` em `/#/redacoes/<id>?visao=aluno`
- Papel: aluno

## Objetivo

O aluno compartilha o próprio progresso com orgulho, sem expor o texto da redação nem, se não quiser, a nota.

## Regras

1. Só o aluno compartilha: o botão "Compartilhar" aparece na devolutiva, nunca na prévia do professor (ADR-0011).
2. O diálogo mostra 3 modelos 9:16 lado a lado: **Por redação**, **Por evolução** (selecionado por padrão) e **Mensagem**. O modelo escolhido tem `aria-pressed="true"`.
3. "Mostrar minha nota" começa desmarcado. Desmarcado:
   - "Por redação" mostra a melhor competência (`melhorCompetencia`, por exemplo "C4 160") no lugar do total;
   - "Por evolução" esconde os valores absolutos: fica só o "+N" e a linha sem rótulos.
   Marcado: "Por redação" mostra o total e o tema; "Por evolução" mostra o total da primeira e da última versão na linha.
4. "Mensagem" usa `mensagemMotivadora(historico)`: modelos fixos preenchidos com os dados (maior avanço desde a primeira versão, competência para focar e sequência de redações). Sem IA e sem mencionar IA.
5. O histórico do story são as versões devolvidas da proposta até a versão aberta.
6. Nenhum texto da redação aparece no story, nem o título dado pelo aluno. Só o tema da proposta, competências e números.
7. "Salvar imagem" gera um PNG de 1080 × 1920 com html-to-image, a partir do story renderizado em tamanho real num nó fora da tela, e baixa `carcara-story-<modelo>.png`.
8. "Postar no story" usa `navigator.share({ files: [png] })` quando `navigator.canShare` aceita o arquivo; senão, cai para "Salvar imagem".
9. Aviso fixo: "O texto da sua redação nunca aparece. A nota fica escondida, a menos que você marque a opção."

## Critérios de aceite

- Dado a devolutiva, quando o aluno toca em Compartilhar, então o diálogo abre com 3 modelos e "Por evolução" selecionado. (sem teste: `08-stories.spec.ts` pendente)
- Dado "Mostrar minha nota" desmarcado, então "Por redação" mostra a melhor competência e "Por evolução" só o "+N"; marcado, aparecem o total e os valores. (sem teste: `08-stories.spec.ts` pendente)
- Dado qualquer modelo, então nenhum trecho da redação aparece no story. (sem teste: `08-stories.spec.ts` pendente)
- Dado "Salvar imagem", então baixa um PNG de 1080 × 1920. (sem teste: `08-stories.spec.ts` pendente)
- Dado um aparelho que compartilha arquivos, então "Postar no story" chama o compartilhamento nativo com o PNG. (sem teste: `08-stories.spec.ts` pendente)
- Dado um aparelho sem compartilhamento, então "Postar no story" baixa a imagem. (sem teste: `08-stories.spec.ts` pendente)
- Dado a prévia do professor, então não há "Compartilhar". → `06` "prévia do professor mostra o radar sem exportar nem compartilhar"
- Regras puras `mensagemMotivadora` e `melhorCompetencia`, inclusive a garantia de não repetir texto da redação. (sem teste: testes unitários pendentes)

## data-testid principais

`devolutiva-compartilhar`, `story-dialog`, `story-redacao`, `story-evolucao`, `story-mensagem`, `story-mostrar-nota`, `story-postar`, `story-salvar`, `story-render`, `story-fechar`, `story-status`.

## Fora do escopo

Integração direta com a API do Instagram, edição do story, stories do professor ou da turma.
