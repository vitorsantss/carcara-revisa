# data-testid

Convenção: `tela-elemento[-detalhe]`. Ids com `<...>` recebem o id do registro.

Atributos auxiliares: `data-status`, `data-tipo`, `data-origem`, `data-autoria`, `data-conferida`, `data-state`, `data-etapa`, `data-visao`, `data-situacao`, `data-alterada`, `data-atendido`, `data-previa`, `data-quantidade`, `data-ativa`, `data-versao`, `data-valores`, `data-diferenca`, `data-competencia`, `data-competencias`, `data-nota`, `data-mais-fraca`, `data-aluno`, `data-turma`, `data-modelo`, `data-mostra-nota`, `data-valor`, `data-total`, `data-erros`, `data-atencoes`, `aria-pressed`.

Impressão: `data-print="hide"` some na impressão; com `imprimir("resumo")`, `data-print="tela"` some e `data-print="resumo"` aparece.

## `components/layout/app-shell.tsx`

- `app-shell`
- `brand`
- `nav-aluno-desempenho`
- `nav-aluno-enviar`
- `nav-aluno-privacidade`
- `nav-aluno-redacoes`
- `nav-bastidores`
- `nav-grupo-<grupo>`
- `nav-instituicao-alunos`
- `nav-instituicao-configuracoes`
- `nav-instituicao-geral`
- `nav-instituicao-professores`
- `nav-professor-desempenho`
- `nav-professor-fila`
- `nav-professor-propostas`
- `nav-professor-turmas`
- `pagina-titulo`
- `papel-aluno`
- `papel-professor`
- `papel-toggle`
- `sidebar`
- `sidebar-abrir`
- `sidebar-fechar`
- `usuario-atual`

## `components/charts/grade-turma.tsx`

Prefixo padrão `grade` (no relatório impresso, `pdf-grade`).

- `grade-turma`
- `grade-mais-fraca`
- `grade-linha-<alunoId>`
- `grade-aluno-<alunoId>`
- `grade-celula-<alunoId>-c<n>`
- `grade-total-<alunoId>`
- `grade-media`
- `grade-media-c<n>`

## `features/aluno/overview-aluno.tsx` e `overview-aluno-page.tsx`

- `overview-aluno`
- `overview-nome`
- `overview-nao-encontrado`
- `overview-vazio`
- `overview-ultima-nota`
- `overview-evolucao-total`
- `overview-melhor-nota`
- `overview-devolvidas`
- `overview-em-andamento`
- `overview-radar`
- `overview-serie-ultima`
- `overview-serie-primeira`
- `overview-evolucao`
- `overview-competencia-c<n>`
- `overview-mais-forte`
- `overview-avanco`
- `overview-foco`
- `overview-versoes`
- `overview-versao-<redacaoId>`
- `overview-versao-abrir-<redacaoId>`

## `features/bastidores/bastidores-page.tsx`

- `bastidores-calibragem`
- `bastidores-calibragem-resumo`
- `bastidores-como-funciona`
- `bastidores-comparacao`
- `bastidores-modelo`
- `bastidores-page`
- `bastidores-redacao`
- `bastidores-regras`
- `bastidores-regras-vazio`
- `bastidores-tabela-comparacao`
- `calibragem-<c>-<tipo>`
- `calibragem-casos`
- `regra-aprendida`

## `features/desempenho/desempenho-page.tsx`

- `desempenho-page`
- `desempenho-abrir-overview`
- `desempenho-visao`
- `desempenho-visao-aluno`
- `desempenho-visao-turma`
- `desempenho-visao-aluno-conteudo`
- `desempenho-visao-turma-conteudo`
- `desempenho-turma-select`
- `desempenho-aluno-select`
- `desempenho-radar`
- `desempenho-ultima-nota`
- `desempenho-evolucao-total`
- `desempenho-evolucao`
- `desempenho-abaixo`
- `desempenho-foco`
- `desempenho-mais-fraca`
- `desempenho-vazio`
- `desempenho-exportar-excel`
- `desempenho-exportar-pdf`
- `desempenho-exportacoes`
- `desempenho-pdf-aluno`
- `desempenho-pdf-turma`

## `features/devolutiva/radar-card.tsx`

- `radar-competencias`
- `radar-serie-atual`
- `radar-serie-anterior`
- `radar-nota-total`
- `radar-delta`
- `radar-nota-c<c>`
- `radar-avanco`
- `radar-foco`
- `radar-exportar-pdf`

## `features/devolutiva/devolutiva.tsx`

- `comentario-<id>`
- `comentario-autor`
- `devolutiva`
- `devolutiva-assinatura`
- `devolutiva-competencia-c<c>`
- `devolutiva-competencias`
- `devolutiva-compartilhar`
- `devolutiva-exportar`
- `devolutiva-filtro`
- `devolutiva-filtro-<t>`
- `devolutiva-folha`
- `devolutiva-glossario`
- `devolutiva-justificativa-c<c>`
- `devolutiva-margem`
- `devolutiva-margem-vazia`
- `devolutiva-missoes`
- `devolutiva-nota-c<c>`
- `devolutiva-nota-total`
- `devolutiva-notas`
- `devolutiva-pedido-c<c>`
- `devolutiva-pedido-confirmacao-c<c>`
- `devolutiva-pedido-confirmacao-zero`
- `devolutiva-pedido-enviar-c<c>`
- `devolutiva-pedido-enviar-zero`
- `devolutiva-pedido-texto-c<c>`
- `devolutiva-pedido-texto-zero`
- `devolutiva-pedido-zero`
- `devolutiva-pedir-c<c>`
- `devolutiva-pedir-zero`
- `devolutiva-proxima`
- `devolutiva-proximo-nivel-c<c>`
- `radar-resumo-impressao`
- `devolutiva-recado`
- `devolutiva-zero`
- `devolutiva-zero-como-evitar`
- `devolutiva-zero-motivo`
- `marca-<card>`
- `missao-c<c>`

## `features/stories/stories-dialog.tsx` e `story.tsx`

- `story-dialog`
- `story-fechar`
- `story-redacao`
- `story-evolucao`
- `story-mensagem`
- `story-mostrar-nota`
- `story-salvar`
- `story-postar`
- `story-status`
- `story-render`
- `story-numero`
- `story-legenda`
- `story-frase`

## `features/envio/envio-page.tsx`

- `duvida-editor` (popup; `data-lado` = `acima` | `abaixo`)
- `duvida-input`
- `duvida-manter`
- `duvida-ok`
- `duvida-sugestao-<j>`
- `envio-adicionar-folha`
- `envio-aviso-<tipo>`
- `envio-avisos`
- `envio-branco-continuar`
- `envio-branco-trocar`
- `envio-colar-continuar`
- `envio-colar-textarea`
- `envio-dicas-foto`
- `envio-enviar`
- `envio-folha-em-branco`
- `envio-folhas`
- `envio-fotos`
- `envio-frases-copiadas`
- `envio-importar-camera`
- `envio-importar-colar`
- `envio-importar-galeria`
- `envio-input-camera`
- `envio-input-galeria`
- `envio-input-mais-folhas`
- `envio-link-privacidade`
- `envio-motivadores`
- `envio-page`
- `envio-privacidade`
- `envio-remover-identificacao`
- `envio-status`
- `envio-tema`
- `envio-usar-exemplo`
- `envio-ver-foto`
- `envio-voltar`
- `transcricao`
- `transcricao-duvida-<id>`
- `transcricao-editar`
- `transcricao-editor`
- `transcricao-editor-concluir`
- `transcricao-editor-texto`
- `transcricao-resumo`

## `features/fila/fila-page.tsx`

- `fila-anterior-<alunoId>`
- `fila-devolver-prontas`
- `fila-devolvida-<id>`
- `fila-exportar`
- `fila-filtro-devolvidas`
- `fila-filtro-revisar`
- `fila-filtro-status`
- `fila-filtro-todas`
- `fila-filtro-turma`
- `fila-filtro-zero`
- `fila-item-<id>`
- `fila-item-alertas`
- `fila-item-inicio`
- `fila-item-nome`
- `fila-item-nota`
- `fila-item-pedido`
- `fila-item-pendentes`
- `fila-item-pre`
- `fila-item-repetida`
- `fila-item-risco-zero`
- `fila-lista`
- `fila-lote-confirmacao`
- `fila-lote-confirmar`
- `fila-ordem`
- `fila-page`
- `fila-proposta`
- `fila-tempo-estimado`
- `fila-vazia`
- `minha-redacao-<id>`
- `minha-redacao-etapa`
- `minha-redacao-explicacao`
- `minhas-redacoes-page`
- `minhas-redacoes-vazio`

## `features/pendente/pendente-page.tsx`

- `pendente-<slug>`
- `pendente-badge`
- `pendente-campos`
- `pendente-desconhecida`
- `pendente-detalhes-tecnicos`
- `pendente-titulo`

## `features/privacidade/privacidade-page.tsx`

- `privacidade-<id>`
- `privacidade-page`

## `features/redacao/essay-document.tsx`

- `<testId>-paragrafo-<pi>`
- `legenda-tipos`
- `marca-<id>`

## `features/redacao/redacao-page.tsx`

- `aluno-aguardando`
- `aluno-alerta-<tipo>`
- `aluno-alertas`
- `aluno-duvidas`
- `aluno-folha`
- `aluno-glossario`
- `aluno-previsao`
- `aluno-proximos-passos`
- `aluno-status`
- `etapa-<id>`
- `redacao-aluno`
- `redacao-etapas`
- `redacao-nao-encontrada`
- `redacao-page` (`data-versao`)

## `features/revisao/revisao.tsx`

- `card-<id>`
- `card-aprovar`
- `card-comentario`
- `card-desfazer`
- `card-editar`
- `card-editor`
- `card-editor-cancelar`
- `card-editor-competencia`
- `card-editor-salvar`
- `card-editor-texto`
- `card-editor-tipo`
- `card-excluir`
- `card-origem`
- `card-pre-aprovada`
- `card-recusa`
- `card-recusa-cancelar`
- `card-recusa-confirmar`
- `card-recusa-motivo`
- `card-recusar`
- `nota-c<c>`
- `nota-total`
- `nova-marcacao-<t>`
- `nova-marcacao-cancelar`
- `nova-marcacao-competencia`
- `popover-conflito`
- `popover-nova-marcacao`
- `revisao`
- `revisao-abrir-repetida`
- `revisao-alerta-<tipo>`
- `revisao-alertas`
- `revisao-atalhos`
- `revisao-cards`
- `revisao-cards-vazio`
- `revisao-comparacao-repetida`
- `revisao-confirmacao`
- `revisao-devolver`
- `revisao-devolver-cancelar`
- `revisao-devolver-confirmar`
- `revisao-filtro`
- `revisao-filtro-pendentes`
- `revisao-filtro-professor`
- `revisao-filtro-todas`
- `revisao-folha`
- `revisao-foto`
- `revisao-foto-zoom`
- `revisao-fotos`
- `revisao-justificativa-c<c>`
- `revisao-legenda-certeza`
- `revisao-nota-alterada-c<c>`
- `revisao-nota-detalhe-c<c>`
- `revisao-notas`
- `revisao-notas-detalhe`
- `revisao-pedido-<id>`
- `revisao-pedidos`
- `revisao-previa`
- `revisao-previa-conteudo`
- `revisao-previa-fechar`
- `revisao-proxima`
- `revisao-reabrir`
- `revisao-recado`
- `revisao-recado-texto`
- `revisao-resumo`
- `revisao-rodape`
- `revisao-sem-foto`
- `revisao-ver-foto`
- `revisao-zero`
- `revisao-zero-anular`
- `revisao-zero-confirmar`
- `revisao-zero-justificativa`
- `revisao-zero-motivo`
