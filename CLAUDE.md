# CLAUDE.md

Guia para agentes de IA (Claude Code e similares) trabalharem neste repositório.

## O produto

Marca-Texto: pré-correção de redações do ENEM com o professor no comando. O aluno envia a foto da folha e confere a transcrição. A correção automática marca trechos como acerto, atenção ou erro, por competência (C1 a C5). O professor revisa como num code review e o aluno recebe a folha marcada.

O diferencial é a **calibragem**: a concordância do professor é contada por competência × tipo. Acima de 95% em 30 casos, aquele tipo chega pré-aprovado. Leia `docs/specs/004-calibragem.md` antes de mexer nisso.

## Comandos

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
npm run typecheck
npm run test:e2e     # Playwright, desktop + mobile
```

Sempre rode `npm run typecheck` e `npm run test:e2e` antes de concluir uma tarefa.

## Arquitetura

| Pasta | Responsabilidade |
| --- | --- |
| `src/domain/` | Tipos (`types.ts`), regras puras (`regras.ts`) e dados fictícios (`seed.ts`). Sem React. |
| `src/services/` | Integrações externas. Hoje SIMULADAS atrás das interfaces `ServicoTranscricao` e `ServicoCorrecao`. |
| `src/store/` | Estado global com `useReducer`. Toda mudança de estado passa por uma ação tipada. |
| `src/features/<feature>/` | Telas e componentes de cada fluxo. |
| `src/components/ui/` | Componentes base no padrão shadcn (cva + `cn`). |
| `src/styles/theme.css` | Única fonte de cores. |
| `e2e/` | Testes Playwright. |

Decisões registradas em `docs/adr/`. Comportamento esperado em `docs/specs/`.

## Convenções

- **Idioma:** código de domínio, UI e testes em português (`redacao`, `marcacao`, `despachar`). Termos técnicos de biblioteca ficam em inglês.
- **Clean code:** nomes autoexplicativos, funções pequenas, regras de negócio em `domain/regras.ts` (funções puras), nunca dentro de componentes. Sem comentários óbvios, sem `console.log` e sem emojis no código.
- **Cores:** só tokens (`bg-primary`, `text-acerto`, `border-l-erro`). Nunca hex nem classes de cor do Tailwind (`bg-blue-500`). Novas cores vão em `theme.css` e em `@theme inline` de `styles/index.css`.
- **Componentes:** antes de criar, veja se existe em `components/ui`. Novos componentes base seguem a API do shadcn.
- **Roteamento:** hash router próprio em `lib/router.ts`. Nova rota = novo ramo em `App.tsx` + item em `MENU` (`components/layout/app-shell.tsx`).
- **data-testid obrigatório** em todo elemento interativo e em todo contêiner que um teste precise encontrar. Convenção `tela-elemento[-detalhe]`; elementos de lista levam o id (`card-<id>`). Atualize `docs/DATA-TESTID.md`.
- **Estado como atributo:** exponha estado testável em `data-*` (`data-status`, `data-tipo`, `data-origem`, `data-etapa`, `data-visao`, `aria-pressed`) em vez de depender de classes CSS.

## Invariantes (não quebre)

1. O aluno só vê marcações aprovadas, editadas, pré-aprovadas ou criadas pelo professor (`visivelParaAluno`).
2. Trecho citado pela correção automática que não existe no texto é descartado (`localizarTrechos`).
3. Nenhum texto de redação vai para calibragem, regras aprendidas ou logs. Regras são bloqueadas por `regraVazaTexto`.
4. "Devolver ao aluno" exige zero marcações automáticas pendentes.
5. Notas só assumem 0, 40, 80, 120, 160 ou 200 por competência.
6. Erro de transcrição (leitura da letra) nunca vira marcação de C1. Erro de escrita do aluno não é corrigido na transcrição.

## Skills do projeto

Em `.claude/skills/`: `nova-feature`, `teste-e2e`, `regras-de-correcao`, `integrar-ia` e `tema-da-marca`. Use a que corresponder à tarefa.

## Fora do escopo atual

Backend, autenticação, persistência e as telas marcadas como "Pendente de implementação". Ao implementar uma delas, crie a spec correspondente em `docs/specs/` primeiro.
