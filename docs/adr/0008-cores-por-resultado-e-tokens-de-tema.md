# ADR-0008: Cores por resultado e tokens de tema

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

As primeiras versões coloriam as marcações por competência (5 cores). Isso escondia o que o aluno mais precisa saber: o que acertou e o que errou. Além disso, a identidade visual do parceiro ainda não estava definida.

## Decisão

Marcações usam o semáforo **verde (acerto), amarelo (atenção), vermelho (erro)**. A competência aparece só como código (C1 a C5). Todas as cores ficam em tokens CSS em `src/styles/theme.css`, mapeados no `@theme inline` do Tailwind 4.

## Alternativas consideradas

- Uma cor por competência: mais informação, menos clareza; legenda pesada para o aluno.

## Consequências

- Positivas: leitura imediata; troca de marca editando um arquivo.
- Negativas: a competência fica menos visível na folha (aparece no card e no comentário).
- Acessibilidade: a cor nunca é a única pista; o tipo também aparece em texto nos cards.
