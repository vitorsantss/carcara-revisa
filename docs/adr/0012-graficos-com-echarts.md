# ADR-0012: Gráficos com Apache ECharts

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

Radar de competências, linha de evolução e os mesmos gráficos dentro dos stories e dos PDFs. O primeiro rascunho da tarefa previa SVG escrito à mão, sem biblioteca. A equipe preferiu padronizar numa biblioteca de gráficos para crescer depois (painel da instituição, mais séries) sem reescrever eixos, tooltips e acessibilidade.

## Decisão

Usar **Apache ECharts** (`echarts/core`, importando só `RadarChart`, `LineChart`, os componentes usados e o `SVGRenderer`) atrás de dois componentes próprios em `src/components/charts/`: `RadarCompetencias` e `LinhaEvolucao`. A `GradeTurma` continua uma tabela HTML: cada célula precisa de `data-testid`, número em texto e clique no aluno.

- Renderizador SVG com largura e altura explícitas: o gráfico sai nítido na impressão, funciona dentro de nós escondidos (prévia de PDF) e é capturado pelo html-to-image nos stories.
- Cores só por token: o componente lê `--serie`, `--serie-ref`, `--border` e os demais tokens do elemento com `getComputedStyle` e converte para `rgb()` antes de passar ao ECharts (`lib/cores.ts`). Nenhuma cor fixa no código.
- Acessibilidade: o contêiner tem `role="img"` e `aria-label` com os valores; legenda, notas e insights aparecem em texto.
- O estado testável fica no DOM ao redor (`data-valores`, legendas com `data-testid`), não dentro do gráfico.

## Alternativas consideradas

- SVG próprio: zero dependência e controle total, mas cada gráfico novo repete eixos, tooltip e responsividade.
- Recharts: API em React, porém o radar é menos configurável e não traz o renderizador SVG com tamanho fixo que a impressão precisa.

## Consequências

- Positivas: tooltips e animação prontos; adicionar séries ou tipos de gráfico é configuração.
- Negativas e custos: bundle maior (cerca de 300 kB com tree shaking); as séries não são elementos do DOM com `data-testid`, então os testes verificam a legenda e os atributos do contêiner.
- O que precisa mudar se a decisão for revista: só os dois componentes em `components/charts/` e o hook `use-echarts.ts`; as telas não importam ECharts diretamente.
