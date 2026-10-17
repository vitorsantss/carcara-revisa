# ADR-0004: Componentes no padrão shadcn, sem Radix

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

Queríamos o visual e a API do shadcn/ui, mas o MVP foi montado com poucas dependências e precisava ser compilado num ambiente sem acesso ao npm.

## Decisão

Os componentes base em `src/components/ui` seguem a API do shadcn (cva, `cn`, variantes `variant`/`size`), escritos com elementos nativos: `ToggleGroup` com botões `aria-pressed`, `NativeSelect` com `<select>`, popover com posição fixa. O `components.json` fica configurado para adicionar componentes oficiais depois.

## Alternativas consideradas

- shadcn completo com Radix: mais acessível em casos complexos (menus, diálogos), mas com mais dependências.
- Biblioteca pronta (MUI, Chakra): visual genérico e difícil de alinhar com a marca do parceiro.

## Consequências

- Positivas: bundle menor; código simples de ler; tema 100% por tokens.
- Negativas: diálogos, dropdowns e tooltips complexos ainda não existem.
- Ao precisar deles: `npx shadcn@latest add <componente>` e manter os mesmos tokens.
