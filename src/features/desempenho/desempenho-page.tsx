import { FileDown, Sheet, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { GradeTurma } from "@/components/charts/grade-turma";
import { LegendaSeries } from "@/components/charts/legenda-series";
import { LinhaEvolucao } from "@/components/charts/linha-evolucao";
import { RadarCompetencias } from "@/components/charts/radar-competencias";
import { useApp } from "@/store/app-store";
import { ALUNOS, INSTITUICAO, PROFESSORES, PROPOSTA, TURMAS, USUARIO_PROFESSOR } from "@/domain/seed";
import {
  SUGESTAO_DE_AULA, competenciaMaisFraca, competenciasAbaixoDaMedia, desempenhoDaTurma, evolucaoTotal, linhasExportacao,
  mediaDaTurma, nomeArquivoExportacao, notaTotal, podeExportar, type DadosExportacao, type DesempenhoAluno, type VisaoDesempenho,
} from "@/domain/regras";
import { NOME_COMPETENCIA, type NotasCompetencias, type Turma } from "@/domain/types";
import { navegar } from "@/lib/router";
import { imprimir } from "@/lib/impressao";
import { comSinal, dataCurta } from "@/lib/utils";
import { RelatorioDaVersao } from "@/features/devolutiva/relatorio-da-versao";
import { RelatorioTurma } from "./relatorio-turma";

const ROTA = "/professor/desempenho";

function irPara(visao: VisaoDesempenho, turmaId: string, alunoId?: string) {
  const params = new URLSearchParams({ visao });
  if (visao === "aluno" && alunoId) params.set("aluno", alunoId);
  params.set("turma", turmaId);
  navegar(`${ROTA}?${params}`);
}

const primeiroNome = (nome: string) => nome.split(" ")[0];

export function DesempenhoPage({ params }: { params: URLSearchParams }) {
  const { estado, despachar } = useApp();
  const professor = PROFESSORES.find((p) => p.id === USUARIO_PROFESSOR);
  const turmas = TURMAS.filter((t) => professor?.turmaIds.includes(t.id));
  const turma = turmas.find((t) => t.id === params.get("turma")) ?? turmas[0];
  const visao: VisaoDesempenho = params.get("visao") === "turma" ? "turma" : "aluno";

  const desempenho = desempenhoDaTurma(estado.redacoes, ALUNOS, turma.id, PROPOSTA.id);
  const media = mediaDaTurma(desempenho.map((d) => d.notas));
  const aluno = desempenho.find((d) => d.alunoId === params.get("aluno")) ?? desempenho[0];
  const exportacaoLiberada = podeExportar(professor, turma.id) && desempenho.length > 0;
  const exportacoes = estado.exportacoes.filter((e) => e.turmaId === turma.id).length;

  const registrar = (formato: "xlsx" | "pdf") =>
    despachar({ type: "registrar_exportacao", professorId: USUARIO_PROFESSOR, turmaId: turma.id, visao, formato, alunoId: visao === "aluno" ? aluno?.alunoId : undefined });

  async function exportarExcel() {
    const dados: DadosExportacao =
      visao === "aluno" ? { visao, nome: aluno.nome, historico: aluno.historico } : { visao, turma: turma.nome, alunos: desempenho };
    const XLSX = await import("xlsx");
    const planilha = XLSX.utils.aoa_to_sheet(linhasExportacao(visao, dados));
    const pasta = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(pasta, planilha, visao === "aluno" ? "Histórico" : "Turma");
    XLSX.writeFile(pasta, nomeArquivoExportacao(turma.nome, new Date()));
    registrar("xlsx");
  }

  function exportarPdf() {
    registrar("pdf");
    imprimir("resumo");
  }

  return (
    <div className="mx-auto max-w-5xl" data-testid="desempenho-page" data-visao={visao} data-turma={turma.id}>
      <div data-print="tela">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Desempenho</h2>
            <p className="text-sm text-muted-foreground">{turma.nome} · {PROPOSTA.temaCurto}, versão atual e anteriores</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground" data-testid="desempenho-exportacoes" data-quantidade={exportacoes}>
              {exportacoes === 1 ? "1 exportação registrada" : `${exportacoes} exportações registradas`}
            </span>
            <Button variant="outline" size="sm" disabled={!exportacaoLiberada} onClick={exportarExcel} data-testid="desempenho-exportar-excel">
              <Sheet /> Excel
            </Button>
            <Button variant="outline" size="sm" disabled={!exportacaoLiberada} onClick={exportarPdf} data-testid="desempenho-exportar-pdf">
              <FileDown /> PDF
            </Button>
          </div>
        </div>

        <Card className="p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <ToggleGroup
              type="single"
              aria-label="Visão"
              data-testid="desempenho-visao"
              value={visao}
              onValueChange={(v) => irPara(v as VisaoDesempenho, turma.id, aluno?.alunoId)}
              items={[
                { value: "aluno", label: "Aluno", testId: "desempenho-visao-aluno" },
                { value: "turma", label: "Turma", testId: "desempenho-visao-turma" },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <NativeSelect aria-label="Turma" value={turma.id} onChange={(e) => irPara(visao, e.target.value)} data-testid="desempenho-turma-select">
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </NativeSelect>
              {visao === "aluno" && aluno && (
                <NativeSelect aria-label="Aluno" value={aluno.alunoId} onChange={(e) => irPara("aluno", turma.id, e.target.value)} data-testid="desempenho-aluno-select">
                  {desempenho.map((d) => (
                    <option key={d.alunoId} value={d.alunoId}>{d.nome}</option>
                  ))}
                </NativeSelect>
              )}
            </div>
          </div>

          {!desempenho.length ? (
            <Alert data-testid="desempenho-vazio">Nenhuma redação devolvida no {turma.nome} ainda. Os gráficos aparecem depois da primeira devolutiva.</Alert>
          ) : visao === "aluno" ? (
            <VisaoAluno aluno={aluno} media={media} turma={turma} />
          ) : (
            <VisaoTurma desempenho={desempenho} media={media} turma={turma} />
          )}
        </Card>
      </div>

      {desempenho.length > 0 &&
        (visao === "aluno" ? (
          <RelatorioDaVersao
            data-testid="desempenho-pdf-aluno"
            titulo={`${aluno.nome} · ${turma.nome}`}
            subtitulo={`${PROPOSTA.temaCurto} · versão ${aluno.historico.at(-1)!.versao}`}
            redacao={aluno.historico.at(-1)!}
            anterior={aluno.historico.at(-2)}
            historico={aluno.historico}
            aviso="Sem texto de redação. Só o professor da turma gera este arquivo, e cada exportação fica registrada."
          />
        ) : (
          <RelatorioTurma
            turma={turma.nome}
            instituicao={INSTITUICAO.nome}
            geradoEm={dataCurta(new Date())}
            desempenho={desempenho}
            media={media}
            maisFraca={competenciaMaisFraca(media)}
          />
        ))}
    </div>
  );
}

function VisaoAluno({ aluno, media, turma }: { aluno: DesempenhoAluno; media: NotasCompetencias; turma: Turma }) {
  const abaixo = competenciasAbaixoDaMedia(aluno.notas, media);
  const foco = competenciaMaisFraca(aluno.notas);
  const evolucao = evolucaoTotal(aluno.historico);
  const nomeCurto = primeiroNome(aluno.nome);
  return (
    <div className="grid gap-6 md:grid-cols-2" data-testid="desempenho-visao-aluno-conteudo" data-aluno={aluno.alunoId}>
      <div className="grid content-start justify-items-center gap-2" data-testid="desempenho-radar" data-aluno={aluno.alunoId} data-valores={aluno.notas.join(",")}>
        <RadarCompetencias
          series={[
            { valores: media, variante: "referencia", nome: `Média ${turma.nome}` },
            { valores: aluno.notas, variante: "principal", nome: `${nomeCurto} (última)` },
          ]}
        />
        <LegendaSeries
          className="justify-center"
          itens={[
            { variante: "principal", rotulo: `${nomeCurto} (última)`, valores: aluno.notas },
            { variante: "referencia", rotulo: `Média ${turma.nome}`, valores: media },
          ]}
        />
      </div>
      <div className="grid content-start gap-5">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Última nota</p>
          <span className="text-4xl font-extrabold leading-none tracking-tight tabular-nums" data-testid="desempenho-ultima-nota">{aluno.total}</span>
          {aluno.historico.length > 1 && (
            <span className="ml-2 text-sm font-bold text-acerto" data-testid="desempenho-evolucao-total" data-diferenca={evolucao}>
              {comSinal(evolucao)} desde a 1ª
            </span>
          )}
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Evolução · {aluno.historico.length} {aluno.historico.length === 1 ? "redação" : "redações"}
          </p>
          <LinhaEvolucao totais={aluno.historico.map(notaTotal)} largura={300} altura={90} data-testid="desempenho-evolucao" />
        </div>
        <div className="grid gap-2 text-sm">
          {abaixo.length ? (
            <p className="flex flex-wrap items-baseline gap-2" data-testid="desempenho-abaixo" data-competencias={abaixo.map((c) => `c${c}`).join(",")}>
              <Badge variant="atencao">Abaixo da turma em</Badge>
              <span>{abaixo.map((c) => `C${c}`).join(", ")}</span>
            </p>
          ) : (
            <p className="flex flex-wrap items-baseline gap-2" data-testid="desempenho-abaixo" data-competencias="">
              <Badge variant="acerto" className="text-foreground">Acima da turma</Badge>
              <span>em todas as competências</span>
            </p>
          )}
          <p className="flex flex-wrap items-baseline gap-2" data-testid="desempenho-foco" data-competencia={`c${foco}`}>
            <Badge variant="atencao">Foco</Badge>
            <span><b>C{foco}</b> {NOME_COMPETENCIA[foco].toLowerCase()}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="justify-self-start" onClick={() => navegar(`/professor/alunos/${aluno.alunoId}`)} data-testid="desempenho-abrir-overview">
          <UserRound /> Ver overview de {nomeCurto}
        </Button>
      </div>
    </div>
  );
}

function VisaoTurma({ desempenho, media, turma }: { desempenho: DesempenhoAluno[]; media: NotasCompetencias; turma: Turma }) {
  const maisFraca = competenciaMaisFraca(media);
  return (
    <div className="grid gap-4" data-testid="desempenho-visao-turma-conteudo">
      <GradeTurma linhas={desempenho} media={media} maisFraca={maisFraca} onAluno={(id) => irPara("aluno", turma.id, id)} />
      <div className="grid gap-2 text-sm">
        <p className="flex flex-wrap items-baseline gap-2" data-testid="desempenho-mais-fraca" data-competencia={`c${maisFraca}`}>
          <Badge variant="atencao">Mais fraca da turma</Badge>
          <span><b>C{maisFraca}</b> {NOME_COMPETENCIA[maisFraca].toLowerCase()} · sugestão: {SUGESTAO_DE_AULA[maisFraca]}</span>
        </p>
        <p className="text-muted-foreground">Toque num aluno para abrir a visão individual.</p>
      </div>
    </div>
  );
}
