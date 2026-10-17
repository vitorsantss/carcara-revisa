import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { useApp } from "@/store/app-store";
import { ALUNOS } from "@/domain/seed";
import { LIMIAR_CALIBRAGEM, LIMITE_INEP, notaAutomaticaTotal, notaFinal, notaTotal } from "@/domain/regras";
import { COMPETENCIAS, NOME_TIPO, type Tipo } from "@/domain/types";
import { PontoTipo } from "@/features/redacao/essay-document";

const PASSOS = [
  ["Importação", "Foto, imagem da galeria ou texto colado. A foto é transcrita sem corrigir nada do aluno."],
  ["Conferência da transcrição", "Palavras que a leitura não reconheceu com segurança ficam em amarelo para o aluno confirmar. Erro de leitura não pode virar erro de C1; erro de escrita do aluno não é tocado."],
  ["Checagens fixas, sem IA", "Linhas (até 7 zera), parágrafos, conectivos repetidos e palavras do tema."],
  ["Correção automática", "Marca trechos como acerto, atenção ou erro, com a competência (C1 a C5), um comentário e a confiança. Trecho citado que não existe no texto é descartado."],
  ["Revisão do professor", "Aprova, recusa, edita e cria correções. Só o que ele aprovou ou criou chega ao aluno."],
  ["Calibragem", `Cada decisão conta por competência e tipo. Acima de ${LIMIAR_CALIBRAGEM.concordancia * 100}% de concordância em ${LIMIAR_CALIBRAGEM.casos} casos, o tipo chega pré-aprovado. Abaixo de 75%, a correção automática fica mais cautelosa.`],
  ["Devolutiva", "Folha marcada, comentários na margem e três missões de reescrita. Na versão 2, cada trecho marcado é conferido de novo."],
];

export function BastidoresPage() {
  const { estado } = useApp();
  const [id, setId] = React.useState(estado.redacoes[0]?.id ?? "");
  const r = estado.redacoes.find((x) => x.id === id) ?? estado.redacoes[0];
  const chaves = Object.keys(estado.calibragem).sort();
  const total = chaves.reduce((s, k) => ({ casos: s.casos + estado.calibragem[k].casos, conc: s.conc + estado.calibragem[k].concordancia }), { casos: 0, conc: 0 });

  return (
    <div className="mx-auto grid max-w-6xl gap-5" data-testid="bastidores-page">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">Bastidores</h2>
        <p className="text-sm text-muted-foreground">Para a equipe: como o sistema funciona. Alunos e professores não veem esta tela.</p>
      </div>

      <Card data-testid="bastidores-como-funciona">
        <CardHeader><CardTitle>Como funciona</CardTitle></CardHeader>
        <CardContent>
          <ol className="grid list-decimal gap-2 pl-5 text-sm">
            {PASSOS.map(([t, d]) => <li key={t}><b className="font-semibold">{t}.</b> {d}</li>)}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card data-testid="bastidores-comparacao">
          <CardHeader>
            <CardTitle>Correção automática × professor</CardTitle>
            <CardDescription>O Inep chama um terceiro corretor quando as notas divergem mais de {LIMITE_INEP.porCompetencia} pontos numa competência ou {LIMITE_INEP.total} no total. Usamos o mesmo limite.</CardDescription>
          </CardHeader>
          <CardContent>
            <NativeSelect value={r?.id} onChange={(e) => setId(e.target.value)} aria-label="Redação" data-testid="bastidores-redacao" className="mb-3">
              {estado.redacoes.map((x) => <option key={x.id} value={x.id}>{ALUNOS.find((a) => a.id === x.alunoId)?.nome}</option>)}
            </NativeSelect>
            {r && (
              <table className="w-full text-sm" data-testid="bastidores-tabela-comparacao">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr><th className="py-1.5">Comp.</th><th>Automática</th><th>Confiança</th><th>Professor</th><th>Limite</th></tr>
                </thead>
                <tbody className="divide-y">
                  {COMPETENCIAS.map((c) => {
                    const a = r.avaliacaoAutomatica[c];
                    const d = Math.abs(notaFinal(r, c) - a.nota);
                    return (
                      <tr key={c}>
                        <td className="py-2 font-mono text-xs font-semibold">C{c}</td>
                        <td className="font-mono">{a.nota}</td>
                        <td className="font-mono">{Math.round(a.confianca * 100)}%</td>
                        <td className="font-mono">{notaFinal(r, c)}</td>
                        <td>{d > LIMITE_INEP.porCompetencia ? <Badge variant="erro">discrepante</Badge> : <Badge variant="acerto">{d ? `dentro (${d})` : "igual"}</Badge>}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-semibold">
                    <td className="py-2">Total</td><td className="font-mono">{notaAutomaticaTotal(r)}</td><td /><td className="font-mono">{notaTotal(r)}</td>
                    <td>{Math.abs(notaTotal(r) - notaAutomaticaTotal(r)) > LIMITE_INEP.total ? <Badge variant="erro">acima</Badge> : <Badge variant="acerto">dentro</Badge>}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card data-testid="bastidores-calibragem">
          <CardHeader>
            <CardTitle>Calibragem do professor</CardTitle>
            <CardDescription data-testid="bastidores-calibragem-resumo">
              Concordância geral {Math.round((total.conc / total.casos) * 100)}% em {total.casos} decisões. Números de exemplo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-1.5">Comp.</th><th>Tipo</th><th>Casos</th><th>Concord.</th><th>Situação</th></tr>
              </thead>
              <tbody className="divide-y">
                {chaves.map((k) => {
                  const [c, tipo] = k.split("|") as [string, Tipo];
                  const x = estado.calibragem[k];
                  const tx = x.casos ? x.concordancia / x.casos : 0;
                  const pre = x.casos >= LIMIAR_CALIBRAGEM.casos && tx >= LIMIAR_CALIBRAGEM.concordancia;
                  return (
                    <tr key={k} data-testid={`calibragem-${c}-${tipo}`}>
                      <td className="py-2 font-mono text-xs font-semibold">C{c}</td>
                      <td><span className="inline-flex items-center gap-1.5"><PontoTipo tipo={tipo} />{NOME_TIPO[tipo]}</span></td>
                      <td className="font-mono" data-testid="calibragem-casos">{x.casos}</td>
                      <td className="font-mono">{Math.round(tx * 100)}%</td>
                      <td>{pre ? <Badge variant="secondary">pré-aprovado</Badge> : tx < 0.75 ? <Badge variant="atencao">mais cautelosa</Badge> : <Badge variant="outline">{x.casos < LIMIAR_CALIBRAGEM.casos ? `faltam ${LIMIAR_CALIBRAGEM.casos - x.casos}` : "em calibragem"}</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="bastidores-regras">
        <CardHeader>
          <CardTitle>Regras aprendidas, sem o texto do aluno</CardTitle>
          <CardDescription>Cada recusa ou omissão apontada pelo professor vira uma regra genérica usada na próxima correção. Nenhuma redação treina modelo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {!estado.regras.length && <p className="text-sm text-muted-foreground" data-testid="bastidores-regras-vazio">Recuse uma correção automática ou crie uma correção de erro para gerar a primeira regra.</p>}
          {estado.regras.map((g) => (
            <div key={g.id} className="grid gap-1.5 rounded-lg border p-3 text-sm" data-testid="regra-aprendida">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold">C{g.competencia}</span>
                <Badge variant="outline">{g.motivo}</Badge>
                <Badge variant="acerto">sem texto do aluno</Badge>
              </div>
              <p>{g.regra}</p>
              <pre className="whitespace-pre-wrap rounded bg-muted p-2 font-mono text-[11px] text-muted-foreground">Sai do aparelho: {JSON.stringify({ competencia: `C${g.competencia}`, motivo: g.motivo, regra: g.regra })}</pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card data-testid="bastidores-modelo">
        <CardHeader>
          <CardTitle>Modelo de dados</CardTitle>
          <CardDescription>Detalhes em docs/MODELAGEM.md.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded bg-muted p-3 font-mono text-xs leading-5">{`Instituição 1──N Turma 1──N Aluno
Professor   N──N Turma
Proposta    N──N Turma
Redação     N──1 Aluno, N──1 Proposta
Redação     1──N Marcação (automática | professor)
Professor   1──N Calibragem (competência × tipo)`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
