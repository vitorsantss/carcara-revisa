---
name: integrar-ia
description: Use ao trocar a transcrição ou a correção simuladas por um modelo real (OCR, LLM) ou ao criar o backend que chama a IA.
---

# Integrar IA real

Leia antes: `docs/adr/0001-correcao-assistida-com-professor-no-comando.md`, `docs/adr/0002-calibragem-por-contagem-sem-treinar-com-redacoes.md` e `docs/adr/0003-ia-atras-de-interfaces-de-servico.md`.

## Contrato

A UI depende só destas interfaces (`src/services/correcao.ts`). Não altere a assinatura sem ADR.

```ts
interface ServicoTranscricao {
  transcrever(imagem: File | "exemplo"): Promise<ResultadoTranscricao>;
}
interface ServicoCorrecao {
  corrigir(texto: string, tema: string): Promise<ResultadoCorrecao>;
}
```

`ResultadoTranscricao`: `{ texto, duvidas: [{ lido, sugestoes[] }] }`.

`ResultadoCorrecao`: `{ motivoZero, avaliacao: { 1..5: { nota, confianca, proximoPasso } }, marcacoes: [{ competencia, tipo, trecho, comentario, sugestao?, confianca }] }`.

A IA devolve `trecho` como citação literal. Os offsets (`inicio`, `fim`) são calculados pelo app em `localizarTrechos`. Nunca confie em offsets vindos do modelo.

## Passos

1. **Backend primeiro.** A chave da API nunca vai para o front. Crie um endpoint (`POST /correcoes`, `POST /transcricoes`) e uma implementação `ServicoCorrecao` no front que só faz `fetch`.
2. **Saída estruturada.** Peça JSON no formato acima (tool use ou JSON schema) e valide no backend com zod antes de responder.
3. **Validação pós-modelo**, no backend:
   - nota fora de `NOTAS_VALIDAS` → arredonde para a válida mais próxima e reduza a confiança;
   - `trecho` inexistente no texto → descarte (o front também descarta);
   - `checagens` (regras fixas) prevalecem: até 7 linhas → `motivoZero`.
4. **Prompt.** Inclua a matriz de referência do INEP por competência, a proposta e as regras aprendidas (`RegraAprendida.regra`) como orientação. Peça acertos além de erros. Proíba reescrever o texto do aluno.
5. **Transcrição.** O OCR transcreve o que está escrito, inclusive erros do aluno. Só palavras ilegíveis viram `duvidas`. Nunca corrija ortografia na transcrição.
6. **Troca no front.** Hoje `features/envio/envio-page.tsx` importa `transcricaoSimulada` e `correcaoSimulada` direto. Crie `src/services/index.ts` que exporta `servicoTranscricao` e `servicoCorrecao` escolhidos por variável de ambiente (ex.: `VITE_IA=simulada|real`) e faça a tela importar de lá. Mantenha as simuladas para testes e demo.

## Privacidade e LGPD

- Redação de aluno é dado pessoal, muitas vezes de menor de idade. Envie ao provedor só com contrato que proíba retenção e treino.
- Não registre texto de redação em logs nem em métricas.
- Treino ou ajuste fino só com consentimento explícito registrado por redação. Regras aprendidas não carregam texto (`regraVazaTexto`).
- Exiba ao aluno "Correção automática", nunca o nome do modelo.

## Testes

- Os e2e continuam usando o serviço simulado (determinístico).
- Teste o endpoint com redações fictícias e compare com notas de referência; acompanhe a divergência pelos limites do INEP.
