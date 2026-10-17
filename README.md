# Carcará Revisa

Pré-correção de redações do ENEM com o professor no comando. MVP da **equipe Carcará** para o **Hackathon PotiCode 2026 (Case 1: devolutiva de redação para todos)**.

O aluno fotografa a folha, confere a transcrição e envia. Uma correção automática marca trechos como **acerto**, **atenção** ou **erro**, cada um ligado a uma competência (C1 a C5). O professor revisa como num code review: aprova, recusa, edita ou cria as próprias correções. O aluno recebe a folha marcada, com comentários na margem e missões de reescrita.

**Diferencial: calibragem.** Cada decisão do professor conta por competência e tipo de apontamento. Quando ele concorda em 95% de 30 casos de um tipo, esse tipo passa a chegar pré-aprovado. Na primeira semana ele revisa tudo; na décima, só o que o sistema ainda não provou que sabe. Para aprender, o sistema guarda só contagens, nunca o texto do aluno.

## Rodando

```bash
npm install
npx playwright install chromium   # só na primeira vez, para os testes
npm run dev                       # http://localhost:5173
```

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção em `dist/` |
| `npm run typecheck` | Checagem de tipos com o TypeScript |
| `npm run test:e2e` | Testes e2e (desktop e celular) |
| `npm run test:e2e:ui` | Testes no modo interativo do Playwright |
| `npm run test:e2e:demo` | Roda os testes devagar, com navegador visível e vídeo (bom para gravar a demo) |

## Roteiro da demo

1. **Enviar redação** → "Usar folha de exemplo" → confira as 3 palavras em amarelo → Enviar.
2. Na mesma redação, use o toggle **Visão do aluno / Visão do professor**.
3. Como professor: recuse uma correção automática, selecione um trecho sem cor e crie uma correção sua, aprove o resto, ajuste uma nota e clique em **Devolver ao aluno**.
4. A tela volta para a visão do aluno: folha marcada, comentários na margem, filtro por cor e **Exportar PDF** (usa a impressão do navegador e respeita o filtro).
5. **Fila de correção** mostra a priorização. **Bastidores** explica as regras, a calibragem e a comparação com o limite do Inep.
6. Os itens "em breve" da sidebar mostram as telas planejadas, com a entidade de dados de cada uma.

## Estrutura

```
src/
  components/ui/        componentes no padrão shadcn (Button, Card, Badge, Input, ToggleGroup…)
  components/layout/    AppShell: sidebar com grupos Aluno, Professor, Instituição, Equipe
  domain/               types.ts (modelo de dados), regras.ts (regras de negócio), seed.ts (dados fictícios)
  services/correcao.ts  transcrição e correção SIMULADAS (troque por chamadas à API)
  store/app-store.tsx   estado global com useReducer
  features/
    envio/              importação + conferência da transcrição
    fila/               fila do professor e "Minhas redações"
    redacao/            página da redação com o toggle aluno/professor e a folha marcada
    revisao/            revisão do professor (cards, recusa, edição, nova marcação)
    devolutiva/         devolutiva do aluno (comentários na margem, filtro, PDF)
    bastidores/         explicação das regras para a equipe
    pendente/           telas planejadas, ainda não implementadas
  styles/theme.css      TODAS as cores do app
e2e/                    testes Playwright
docs/                   modelagem e lista de data-testid
```

## Tema

Todas as cores ficam em `src/styles/theme.css`. Para trocar a identidade visual, mude os valores de `--brand-*` e `--highlight`. As cores do semáforo da correção (`--acerto`, `--atencao`, `--erro`) também ficam lá. Os componentes usam só tokens (`bg-primary`, `text-muted-foreground`…), sem cor fixa.

A paleta atual é provisória. Ajuste com as cores oficiais do parceiro.

## Componentes

Os componentes em `src/components/ui` seguem a API e o visual do [shadcn/ui](https://ui.shadcn.com) (cva + `cn`), escritos sem Radix para manter o MVP enxuto. O `components.json` já está configurado: dá para adicionar componentes oficiais com `npx shadcn@latest add dialog`, por exemplo.

## Testes e data-testid

Todo elemento interativo tem `data-testid`. A convenção é `tela-elemento[-detalhe]`, por exemplo `envio-usar-exemplo`, `card-aprovar`, `devolutiva-filtro-erro`. Elementos ligados a um registro levam o id: `fila-item-r-ana`, `marca-<id>`, `card-<id>`. A lista completa está em [docs/DATA-TESTID.md](docs/DATA-TESTID.md).

Atributos úteis para asserções: `data-status` (pendente, pre_aprovada, aprovada, editada, recusada), `data-tipo` (acerto, atencao, erro), `data-origem` (automatica, professor), `data-etapa` e `data-visao` na página da redação.

## O que é simulado

- **Transcrição (OCR):** qualquer imagem devolve a folha de exemplo com 3 palavras duvidosas.
- **Correção automática:** o texto de exemplo tem gabarito; outros textos passam por heurísticas simples em `services/correcao.ts`.
- **Persistência:** o estado vive em memória e reinicia ao recarregar.

As interfaces `ServicoTranscricao` e `ServicoCorrecao` já separam isso: basta trocar a implementação por chamadas à API real.

## Privacidade (LGPD)

- Linhas com nome, e-mail ou telefone são removidas antes do envio.
- Nenhuma redação é usada para treinar modelos.
- A calibragem guarda só contagens por competência e tipo.
- Regras aprendidas com as recusas são bloqueadas se repetirem 4 palavras seguidas do texto do aluno (`regraVazaTexto`).

## Documentação para pessoas e agentes de IA

| Onde | O quê |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Guia do repositório para agentes (Claude Code, Codex via `AGENTS.md`): comandos, arquitetura, convenções e invariantes. |
| [`docs/specs/`](docs/specs/README.md) | Comportamento esperado de cada fluxo, com critérios de aceite ligados aos testes e2e. |
| [`docs/adr/`](docs/adr/README.md) | Decisões de arquitetura e o porquê de cada uma. |
| [`docs/MODELAGEM.md`](docs/MODELAGEM.md) | Entidades e relacionamentos. |
| `.claude/skills/` | Roteiros para tarefas recorrentes: `nova-feature`, `teste-e2e`, `regras-de-correcao`, `integrar-ia`, `tema-da-marca`. |

## Referências

- Cartilha do Participante, A Redação no Enem (Inep): critérios das 5 competências e motivos de nota zero.
- Essay-BR (Marinho, Anchiêta e Moura, 2022): corpus público para medir a concordância da correção automática com notas humanas. Uso para pesquisa e avaliação, não para treinar o produto.
