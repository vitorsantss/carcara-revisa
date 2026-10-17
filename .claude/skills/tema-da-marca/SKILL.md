---
name: tema-da-marca
description: Use ao ajustar cores, fontes, raios ou a identidade visual do Carcará Revisa, ou ao adicionar um novo token de cor.
---

# Tema da marca

Leia antes: `docs/adr/0008-cores-por-resultado-e-tokens-de-tema.md`.

## Onde fica cada coisa

| Arquivo | Conteúdo |
| --- | --- |
| `src/styles/theme.css` | Valores. Tokens da marca (`--brand-900/700/500/100`, `--highlight`), tokens shadcn (`--primary`, `--muted`…), semáforo (`--acerto`, `--atencao`, `--erro` e `-bg`), sidebar e `.dark`. |
| `src/styles/index.css` | `@theme inline`: expõe cada variável ao Tailwind (`--color-primary: var(--primary)`). Estilos das marcações (`.mark[data-tipo]`) e impressão. |
| `index.html` | Fontes (Plus Jakarta Sans na interface, Source Serif 4 na folha). |

## Trocar a cor da marca

1. Edite só os `--brand-*` e `--highlight` em `theme.css`. Os tokens shadcn derivam deles.
2. Confira contraste AA (4,5:1) de `--primary-foreground` sobre `--primary` e do texto sobre `--highlight`.
3. Rode o app nas três telas principais (envio, revisão, devolutiva) e no modo escuro.

## Adicionar um token

1. Declare em `:root` e em `.dark` no `theme.css`.
2. Mapeie em `@theme inline` no `index.css`: `--color-<nome>: var(--<nome>);`.
3. Use como classe: `bg-<nome>`, `text-<nome>`, `border-<nome>`.

## Proibido

- Hex, rgb ou oklch fora de `theme.css`.
- Classes de cor do Tailwind (`bg-blue-500`, `text-gray-600`).
- Mudar o significado do semáforo: verde é acerto, amarelo é atenção, vermelho é erro. Competência não tem cor.
- Usar cor como única pista: tipo e competência também aparecem em texto.
