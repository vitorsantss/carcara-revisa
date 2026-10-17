# ADR-0011: Privacidade no compartilhamento

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

Os stories (SPEC-009) levam o progresso do aluno para fora da plataforma, numa rede social pública. A redação é produção intelectual do aluno, pode conter dados pessoais e, publicada, facilita plágio. A nota pode constranger quem ainda está começando.

## Decisão

1. **Só o aluno compartilha.** O botão aparece só na devolutiva vista pelo aluno; professor, prévia e instituição não geram story de ninguém.
2. **Nunca texto de redação.** O story mostra só o tema da proposta, códigos e nomes das competências, notas e frases de modelos fixos (`mensagemMotivadora`). Nem o título escrito pelo aluno entra. Um teste e2e compara o texto do story com o da redação, e um teste unitário garante que a mensagem não repete 4 palavras seguidas do texto (`regraVazaTexto`).
3. **Nota escondida por padrão.** "Mostrar minha nota" começa desmarcado. Sem ela, os modelos usam a melhor competência e o ganho ("+N"), nunca o total.
4. A imagem é gerada no próprio aparelho (html-to-image) e entregue pelo compartilhamento nativo ou por download. Nada vai para um servidor.

## Alternativas consideradas

- Mostrar um trecho elogiado da redação: atraente, mas expõe o texto e incentiva cópia.
- Nota visível por padrão: mais engajamento para quem foi bem, constrangimento para quem não foi.

## Consequências

- Positivas: o aluno escolhe o que expõe; nada da redação sai da plataforma.
- Negativas e custos: o story fica menos personalizado; html-to-image aumenta o bundle (carregado só no clique).
- O que precisa mudar se a decisão for revista: `features/stories`, `mensagemMotivadora` e os testes `08`.
