---
name: nova-feature
description: Use ao criar uma tela ou fluxo novo no Marca-Texto, inclusive ao tirar uma tela do estado "Pendente de implementação".
---

# Nova feature

Ordem obrigatória: spec → teste → código. Não pule etapas.

## 1. Spec

1. Copie o formato de `docs/specs/README.md` para `docs/specs/NNN-<nome>.md` (próximo número livre).
2. Preencha objetivo, regras numeradas e critérios de aceite em Dado/Quando/Então.
3. Se a feature exigir uma decisão de arquitetura (nova dependência, novo padrão de estado, backend), registre um ADR em `docs/adr/` a partir de `0000-modelo.md`.

## 2. Domínio

1. Tipos novos em `src/domain/types.ts`.
2. Regras de negócio como funções puras em `src/domain/regras.ts`. Nunca dentro de componente.
3. Dados fictícios em `src/domain/seed.ts`. Nada de nome real de aluno ou escola.

## 3. Estado

Se a feature muda dados, crie uma ação tipada no reducer de `src/store/app-store.tsx`. Componentes só chamam `despachar({ tipo: ... })`.

## 4. Tela

1. Crie `src/features/<feature>/<feature>-page.tsx`.
2. Rota: novo ramo em `src/App.tsx`.
3. Menu: item em `MENU` de `src/components/layout/app-shell.tsx`, com `testId` `nav-<grupo>-<slug>`.
4. Se a tela substitui uma pendente, remova a entrada de `TELAS_PENDENTES` (`features/pendente/pendente-page.tsx`) e de `e2e/telas.ts`.
5. Use os componentes de `src/components/ui`. Cores só por token (`bg-primary`, `text-erro`).
6. `data-testid` em todo elemento interativo e contêiner testável, no formato `tela-elemento[-detalhe]`. Estado testável em `data-*`.

## 5. Testes e documentação

1. Siga a skill `teste-e2e`: um teste por critério de aceite da spec.
2. Atualize `docs/DATA-TESTID.md`.
3. Marque a spec como `Implementada`.

## Checklist final

- [ ] `npm run typecheck` sem erros
- [ ] `npm run test:e2e` verde em desktop e mobile
- [ ] Nenhum `console.log`, comentário óbvio, hex ou cor do Tailwind
- [ ] Invariantes do `CLAUDE.md` preservadas
