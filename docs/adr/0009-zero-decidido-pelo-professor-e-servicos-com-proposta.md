# ADR-0009: Zero decidido pelo professor e serviços que recebem a proposta

- **Status:** Proposto
- **Data:** 2026-10-17

## Contexto

O teste com cinco personas (`personas/relatorios/consolidado.md`) mostrou quatro problemas:

- uma redação de 6 linhas com selo "risco de nota zero" foi devolvida com 520;
- cópia dos motivadores, nome no rodapé, fuga ao tema e relato pessoal passaram sem aviso;
- uma redação em frente e verso não tinha como ser enviada;
- o aluno não sabia por que tirou zero.

Para detectar cópia e fuga ao tema, a correção precisa dos textos motivadores e do núcleo do tema, não só do enunciado. Para frente e verso, a transcrição precisa aceitar mais de uma imagem.

## Decisão

1. As interfaces de serviço mudam para:
   - `transcrever(imagens: Array<File | "exemplo">)`
   - `corrigir(texto, proposta, nomesDoAluno?)`

   `ResultadoCorrecao` ganha `alertas`, e cada `AvaliacaoCompetencia` ganha `justificativa`.
2. Todo `motivoZero` entra como **zero sugerido**. Enquanto vale (sugerido ou confirmado), `notaFinal` é 0. O professor confirma ou anula, com mensagem opcional ao aluno. Devolver exige essa decisão, além de zero marcações pendentes.
3. As checagens de identificação, cópia, fuga ao tema, relato pessoal, texto cortado e texto repetido são funções puras em `domain/regras.ts`. Os alertas não carregam trecho da redação.

## Alternativas consideradas

- Manter `corrigir(texto, tema)` e detectar cópia só no front. Descartada: a correção real também precisa dos motivadores para não premiar cópia como repertório.
- Zerar automaticamente. Descartada: contraria o ADR-0001, porque a máquina não decide nota. Heurísticas de fuga ao tema e de relato pessoal erram, e um zero injusto tira o aluno do Sisu.

## Consequências

- Positivas: um zero nunca sai sem decisão do professor, e o aluno recebe o motivo e como evitar. Cópia e identificação deixam de ganhar nota de repertório.
- Negativas e custos: há uma decisão a mais por redação com zero sugerido. As heurísticas são simples (6 palavras seguidas para cópia, lista de expressões do núcleo do tema, densidade de primeira pessoa) e devem ser substituídas pela correção real (skill `integrar-ia`).
- O que precisa mudar se a decisão for revista: `podeDevolver`, `notaFinal` e `zeroAtivo` em `regras.ts`, o painel de zero em `revisao.tsx` e o bloco de zero da devolutiva.
