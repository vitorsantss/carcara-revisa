import * as React from "react";
import { AlertTriangle, Camera, ChevronDown, ClipboardPaste, ImageIcon, ImagePlus, Lightbulb, Pencil, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { useApp } from "@/store/app-store";
import { navegar } from "@/lib/router";
import { pareceFolhaEmBranco } from "@/lib/imagem";
import { correcaoSimulada, transcricaoSimulada } from "@/services/correcao";
import { TEXTO_ALERTA, alertasDoTexto, checagens, frasesCopiadas, linhasDeIdentificacao, montarRedacao, redacaoRepetida, removerLinhas } from "@/domain/regras";
import { ALUNOS, PROPOSTA, USUARIO_ALUNO } from "@/domain/seed";
import type { TipoAlerta } from "@/domain/types";
import { cn } from "@/lib/utils";

interface Duvida {
  id: number;
  lido: string;
  atual: string;
  sugestoes: string[];
  conferida: boolean;
}
type Etapa = "importar" | "colar" | "conferir";
type Folha = File | "exemplo";

const NOME_ALUNO = ALUNOS.find((a) => a.id === USUARIO_ALUNO)!.nome;

export function EnvioPage() {
  const { estado, despachar } = useApp();
  const [etapa, setEtapa] = React.useState<Etapa>("importar");
  const [texto, setTexto] = React.useState("");
  const [duvidas, setDuvidas] = React.useState<Duvida[]>([]);
  const [aberta, setAberta] = React.useState<{ id: number; ancora: HTMLElement } | null>(null);
  const [origem, setOrigem] = React.useState<"foto" | "texto">("foto");
  const [folhas, setFolhas] = React.useState<Folha[]>([]);
  const [suspeitaBranco, setSuspeitaBranco] = React.useState<Folha[] | null>(null);
  const [editandoTexto, setEditandoTexto] = React.useState(false);
  const [ocupado, setOcupado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const camRef = React.useRef<HTMLInputElement>(null);
  const galRef = React.useRef<HTMLInputElement>(null);
  const maisRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const aoVoltar = () => setErro((e) => (e?.startsWith("Sem internet") ? null : e));
    window.addEventListener("online", aoVoltar);
    return () => window.removeEventListener("online", aoVoltar);
  }, []);
  const urls = React.useMemo(() => folhas.map((f) => (f === "exemplo" ? null : URL.createObjectURL(f))), [folhas]);

  async function escolherFotos(novas: Folha[], acrescentar = false) {
    if (!novas.length) return;
    setErro(null);
    const arquivos = novas.filter((f): f is File => f !== "exemplo");
    const brancas = await Promise.all(arquivos.map(pareceFolhaEmBranco));
    const lista = acrescentar ? [...folhas, ...novas] : novas;
    if (brancas.some(Boolean)) {
      setSuspeitaBranco(lista);
      return;
    }
    await transcrever(lista);
  }

  async function transcrever(lista: Folha[]) {
    setSuspeitaBranco(null);
    setOcupado(lista.length > 1 ? `Lendo ${lista.length} folhas…` : "Lendo a folha…");
    const r = await transcricaoSimulada.transcrever(lista);
    setFolhas(lista);
    setTexto(r.texto);
    setDuvidas(r.duvidas.map((d, i) => ({ id: i, lido: d.lido, atual: d.lido, sugestoes: d.sugestoes, conferida: false })));
    setOrigem("foto");
    setEditandoTexto(false);
    setOcupado(null);
    setEtapa("conferir");
  }

  function trocar(d: Duvida, valor: string) {
    const v = valor.trim() || d.atual;
    const i = texto.indexOf(d.atual);
    if (i >= 0) setTexto(texto.slice(0, i) + v + texto.slice(i + d.atual.length));
    setDuvidas((ds) => ds.map((x) => (x.id === d.id ? { ...x, atual: v, conferida: true } : x)));
    setAberta(null);
  }

  function concluirEdicao() {
    setDuvidas((ds) => ds.map((d) => (texto.includes(d.atual) ? d : { ...d, conferida: true })));
    setEditandoTexto(false);
  }

  const repetida = texto.trim() ? redacaoRepetida(texto, USUARIO_ALUNO, estado.redacoes) : undefined;
  const alertas: TipoAlerta[] = texto.trim() ? [...alertasDoTexto(texto, PROPOSTA, [NOME_ALUNO]), ...(repetida ? ["texto_repetido" as const] : [])] : [];
  const linhasIdentificacao = linhasDeIdentificacao(texto, [NOME_ALUNO]);
  const curto = texto.trim() ? checagens(texto, PROPOSTA.tema).zeraPorLinhas : false;

  async function enviar() {
    if (ocupado) return;
    const limpo = texto.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
    if (limpo.length < 120) {
      setErro("Texto curto demais para enviar.");
      return;
    }
    if (!navigator.onLine) {
      setErro("Sem internet agora. Seu texto continua aqui: tente enviar de novo quando a conexão voltar.");
      return;
    }
    setErro(null);
    setOcupado("Enviando…");
    const resultado = await correcaoSimulada.corrigir(limpo, PROPOSTA, [NOME_ALUNO]);
    const id = `r-${Date.now()}`;
    const redacao = montarRedacao(
      {
        id, alunoId: USUARIO_ALUNO, propostaId: PROPOSTA.id, texto: limpo, enviadaEm: new Date().toISOString(), versao: 1, etapa: "enviada",
        duvidasDeTranscricao: duvidas.length,
        imagens: urls.filter((u): u is string => !!u),
        alertas: repetida ? ["texto_repetido"] : [],
        repeteRedacaoId: repetida?.id,
      },
      resultado,
      estado.calibragem,
    );
    despachar({ type: "enviar", redacao });
    setOcupado(null);
    navegar(`/redacoes/${id}?visao=aluno`);
  }

  const abertas = duvidas.filter((d) => !d.conferida).length;
  const duvidaAberta = duvidas.find((d) => d.id === aberta?.id);
  const alternarDuvida = (id: number, ancora: HTMLElement) => setAberta(aberta?.id === id ? null : { id, ancora });
  const arquivosDoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lista = Array.from(e.target.files ?? []);
    e.target.value = "";
    return lista;
  };

  return (
    <div className="mx-auto max-w-xl" data-testid="envio-page">
      <Card className="rounded-2xl">
        {etapa === "importar" && !suspeitaBranco && (
          <>
            <CardHeader>
              <CardTitle>Enviar redação</CardTitle>
              <CardDescription data-testid="envio-tema">{PROPOSTA.tema}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <details className="group rounded-lg border bg-muted/40 px-3 py-2 text-sm" data-testid="envio-motivadores">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                  Textos motivadores <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-muted-foreground">
                  {PROPOSTA.motivadores.map((m) => <li key={m}>{m}</li>)}
                </ol>
                <p className="mt-2 text-xs text-muted-foreground">Use as ideias, mas escreva com suas palavras: frases copiadas não contam para a nota.</p>
              </details>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
                <OpcaoImportar icone={Camera} titulo="Tirar foto" sub="da folha" testId="envio-importar-camera" onClick={() => camRef.current?.click()} />
                <OpcaoImportar icone={ImageIcon} titulo="Imagens" sub="frente e verso" testId="envio-importar-galeria" onClick={() => galRef.current?.click()} />
                <OpcaoImportar icone={ClipboardPaste} titulo="Colar texto" sub="já digitado" testId="envio-importar-colar" onClick={() => setEtapa("colar")} />
              </div>
              <div className="flex gap-2.5 rounded-lg bg-secondary/60 px-3 py-2.5 text-xs text-secondary-foreground" data-testid="envio-dicas-foto">
                <Lightbulb className="mt-0.5 size-4 shrink-0" />
                <p>
                  <b>Para a foto sair boa:</b> folha inteira no quadro, de cima, sem sombra e com luz branca. Se a redação usou frente e verso, envie as duas imagens juntas.
                </p>
              </div>
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" data-testid="envio-input-camera" onChange={(e) => escolherFotos(arquivosDoInput(e))} />
              <input ref={galRef} type="file" accept="image/*,application/pdf" multiple className="hidden" data-testid="envio-input-galeria" onChange={(e) => escolherFotos(arquivosDoInput(e))} />
              <Button variant="outline" onClick={() => transcrever(["exemplo"])} data-testid="envio-usar-exemplo">
                <ScanText /> Usar folha de exemplo
              </Button>
              <Status ocupado={ocupado} erro={erro} />
            </CardContent>
          </>
        )}

        {suspeitaBranco && (
          <>
            <CardHeader>
              <CardTitle>Essa foto parece estar em branco</CardTitle>
              <CardDescription>Não encontramos texto na imagem. Você fotografou o lado certo da folha?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2" data-testid="envio-folha-em-branco">
              <Button onClick={() => { setSuspeitaBranco(null); setEtapa(folhas.length ? "conferir" : "importar"); }} data-testid="envio-branco-trocar">Escolher outra foto</Button>
              <Button variant="ghost" onClick={() => transcrever(suspeitaBranco)} data-testid="envio-branco-continuar">Continuar com esta</Button>
            </CardContent>
          </>
        )}

        {etapa === "colar" && (
          <>
            <CardHeader>
              <CardTitle>Colar texto</CardTitle>
              <CardDescription>Cole a redação como foi escrita.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-72 font-serif text-[15px] leading-7" data-testid="envio-colar-textarea" aria-label="Redação" />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEtapa("importar")} data-testid="envio-voltar">Voltar</Button>
                <Button onClick={() => { setDuvidas([]); setFolhas([]); setOrigem("texto"); setEtapa("conferir"); }} disabled={!texto.trim()} data-testid="envio-colar-continuar">Continuar</Button>
              </div>
            </CardContent>
          </>
        )}

        {etapa === "conferir" && !suspeitaBranco && (
          <>
            <CardHeader>
              <CardTitle>{origem === "texto" ? "Confira o texto" : "Confira o texto lido da sua foto"}</CardTitle>
              <CardDescription data-testid="transcricao-resumo">
                {origem === "texto"
                  ? "Confira o texto antes de enviar."
                  : abertas
                    ? `${abertas} palavra${abertas > 1 ? "s" : ""} em amarelo: a leitura da sua letra não teve certeza. Toque para confirmar.`
                    : "Tudo conferido. Seus próprios erros de escrita continuam no texto: eles fazem parte da correção."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {origem === "foto" && (
                <Folhas folhas={folhas} urls={urls} onAdicionar={() => maisRef.current?.click()} />
              )}
              <input ref={maisRef} type="file" accept="image/*" multiple className="hidden" data-testid="envio-input-mais-folhas" onChange={(e) => escolherFotos(arquivosDoInput(e), true)} />

              {editandoTexto ? (
                <div className="grid gap-2" data-testid="transcricao-editor">
                  <p className="text-xs text-muted-foreground">
                    Corrija só o que a leitura entendeu errado. Não corrija seus próprios erros de escrita: eles fazem parte da correção.
                  </p>
                  <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-72 font-serif text-[15px] leading-7" aria-label="Texto da redação" data-testid="transcricao-editor-texto" />
                  <Button variant="secondary" className="justify-self-start" onClick={concluirEdicao} data-testid="transcricao-editor-concluir">Concluir correção</Button>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto rounded-lg border px-4 py-3 font-serif text-[15.5px] leading-[1.85]" data-testid="transcricao">
                  {texto.split("\n").filter((p) => p.trim()).map((p, pi) => (
                    <p key={pi} className="mb-2.5">{renderComDuvidas(p, duvidas, alternarDuvida)}</p>
                  ))}
                </div>
              )}
              {!editandoTexto && (
                <Button variant="link" className="justify-self-start px-0" onClick={() => { setAberta(null); setEditandoTexto(true); }} data-testid="transcricao-editar">
                  <Pencil /> {origem === "foto" ? "A leitura errou outras palavras? Corrigir o texto" : "Corrigir o texto"}
                </Button>
              )}
              {duvidaAberta && aberta && !editandoTexto && (
                <EditorDuvida key={duvidaAberta.id} d={duvidaAberta} ancora={aberta.ancora} onEscolher={(v) => trocar(duvidaAberta, v)} onFechar={() => setAberta(null)} />
              )}

              <Avisos
                alertas={alertas}
                curto={curto}
                copiadas={frasesCopiadas(texto, PROPOSTA.motivadores).frases}
                onRemoverIdentificacao={linhasIdentificacao.length ? () => setTexto(removerLinhas(texto, linhasIdentificacao)) : undefined}
              />

              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setEtapa("importar")} data-testid="envio-voltar">Voltar</Button>
                <Button onClick={enviar} disabled={abertas > 0 || !!ocupado || editandoTexto} data-testid="envio-enviar">Enviar para correção</Button>
              </div>
              <Status ocupado={ocupado} erro={erro} />
            </CardContent>
          </>
        )}
      </Card>
      <p className="mt-3 text-center text-xs text-muted-foreground" data-testid="envio-privacidade">
        Sua foto e seu texto só são vistos por você e pelo seu professor, e não são usados para treinar modelos.{" "}
        <a href="#/aluno/privacidade" className="font-semibold text-primary underline underline-offset-2" data-testid="envio-link-privacidade">Saiba mais</a>
      </p>
    </div>
  );
}

function Folhas({ folhas, urls, onAdicionar }: { folhas: Folha[]; urls: Array<string | null>; onAdicionar: () => void }) {
  const [ver, setVer] = React.useState(false);
  return (
    <div className="grid gap-2" data-testid="envio-folhas" data-quantidade={folhas.length}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{folhas.length === 1 ? "1 folha" : `${folhas.length} folhas`}</span>
        {urls.some(Boolean) && (
          <Button size="sm" variant="ghost" onClick={() => setVer(!ver)} aria-expanded={ver} data-testid="envio-ver-foto">
            {ver ? "Esconder foto" : "Ver foto"}
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-auto min-h-8 whitespace-normal py-1" onClick={onAdicionar} data-testid="envio-adicionar-folha">
          <ImagePlus /> Adicionar verso ou outra folha
        </Button>
      </div>
      {ver && (
        <div className="flex gap-2 overflow-x-auto" data-testid="envio-fotos">
          {urls.map((u, i) => u && <img key={u} src={u} alt={`Folha ${i + 1}`} className="max-h-72 rounded-md border" />)}
        </div>
      )}
    </div>
  );
}

function Avisos({ alertas, curto, copiadas, onRemoverIdentificacao }: { alertas: TipoAlerta[]; curto: boolean; copiadas: string[]; onRemoverIdentificacao?: () => void }) {
  if (!alertas.length && !curto) return null;
  return (
    <ul className="grid gap-2" data-testid="envio-avisos">
      {curto && (
        <Aviso tipo="texto_curto">Seu texto tem até 7 linhas. No Enem, redações com até 7 linhas recebem nota zero.</Aviso>
      )}
      {alertas.map((a) => (
        <Aviso key={a} tipo={a}>
          {TEXTO_ALERTA[a].aluno}
          {a === "copia_motivadores" && (
            <ul className="mt-1 grid list-disc gap-0.5 pl-5 font-serif text-xs italic" data-testid="envio-frases-copiadas">
              {copiadas.map((f) => <li key={f}>“{f}”</li>)}
            </ul>
          )}
          {a === "identificacao" && onRemoverIdentificacao && (
            <Button size="sm" variant="outline" className="mt-2" onClick={onRemoverIdentificacao} data-testid="envio-remover-identificacao">Remover a linha</Button>
          )}
        </Aviso>
      ))}
    </ul>
  );
}

function Aviso({ tipo, children }: { tipo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 rounded-lg border border-atencao bg-atencao-bg px-3 py-2.5 text-sm" data-testid={`envio-aviso-${tipo}`}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="grid justify-items-start">{children}</div>
    </li>
  );
}

function renderComDuvidas(paragrafo: string, duvidas: Duvida[], abrir: (id: number, ancora: HTMLElement) => void) {
  const out: React.ReactNode[] = [];
  let resto = paragrafo;
  let k = 0;
  while (resto.length) {
    let melhor: { i: number; d: Duvida } | null = null;
    for (const d of duvidas) {
      const i = resto.indexOf(d.atual);
      if (i >= 0 && (!melhor || i < melhor.i)) melhor = { i, d };
    }
    if (!melhor) {
      out.push(resto);
      break;
    }
    out.push(resto.slice(0, melhor.i));
    const d = melhor.d;
    out.push(
      <button
        key={`d${k++}`}
        type="button"
        onClick={(e) => abrir(d.id, e.currentTarget)}
        data-duvida
        data-testid={`transcricao-duvida-${d.id}`}
        data-conferida={d.conferida}
        title={d.conferida ? "Conferida" : "A leitura não teve certeza desta palavra"}
        className={cn(
          "cursor-pointer rounded-sm px-0.5 font-serif",
          d.conferida ? "border-b-2 border-acerto" : "border-b-2 border-dashed border-atencao bg-atencao-bg",
        )}
      >
        {d.atual}
      </button>,
    );
    resto = resto.slice(melhor.i + d.atual.length);
  }
  return out;
}

const MARGEM_POPUP = 8;
const DISTANCIA_DA_PALAVRA = 10;

interface PosicaoPopup {
  x: number;
  y: number;
  seta: number;
  lado: "acima" | "abaixo";
}

function posicaoJuntoDaPalavra(palavra: DOMRect, largura: number, altura: number): PosicaoPopup {
  const cabeAcima = palavra.top - DISTANCIA_DA_PALAVRA - altura >= MARGEM_POPUP;
  const centro = palavra.left + palavra.width / 2;
  const x = Math.max(MARGEM_POPUP, Math.min(centro - largura / 2, window.innerWidth - largura - MARGEM_POPUP));
  const yAbaixo = Math.min(palavra.bottom + DISTANCIA_DA_PALAVRA, window.innerHeight - altura - MARGEM_POPUP);
  return {
    x,
    y: cabeAcima ? palavra.top - DISTANCIA_DA_PALAVRA - altura : Math.max(MARGEM_POPUP, yAbaixo),
    seta: Math.max(16, Math.min(centro - x, largura - 16)),
    lado: cabeAcima ? "acima" : "abaixo",
  };
}

function usePosicaoJuntoDaPalavra(ancora: HTMLElement, popup: React.RefObject<HTMLDivElement | null>) {
  const [posicao, setPosicao] = React.useState<PosicaoPopup | null>(null);
  React.useLayoutEffect(() => {
    const atualizar = () => {
      if (!popup.current) return;
      const palavra = ancora.getBoundingClientRect();
      const area = ancora.closest("[data-testid='transcricao']")?.getBoundingClientRect();
      const palavraVisivel = !area || (palavra.bottom > area.top && palavra.top < area.bottom);
      setPosicao(palavraVisivel ? posicaoJuntoDaPalavra(palavra, popup.current.offsetWidth, popup.current.offsetHeight) : null);
    };
    atualizar();
    const aoMudarLayout = new ResizeObserver(atualizar);
    aoMudarLayout.observe(document.body);
    document.fonts?.ready.then(atualizar);
    window.addEventListener("scroll", atualizar, true);
    window.addEventListener("resize", atualizar);
    return () => {
      aoMudarLayout.disconnect();
      window.removeEventListener("scroll", atualizar, true);
      window.removeEventListener("resize", atualizar);
    };
  }, [ancora, popup]);
  return posicao;
}

function useFecharAoSair(popup: React.RefObject<HTMLDivElement | null>, onFechar: () => void) {
  React.useEffect(() => {
    const aoTocar = (e: PointerEvent) => {
      const alvo = e.target as Element;
      if (!popup.current?.contains(alvo) && !alvo.closest("[data-duvida]")) onFechar();
    };
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("pointerdown", aoTocar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoTocar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [popup, onFechar]);
}

function EditorDuvida({ d, ancora, onEscolher, onFechar }: { d: Duvida; ancora: HTMLElement; onEscolher: (v: string) => void; onFechar: () => void }) {
  const [valor, setValor] = React.useState(d.atual);
  const ref = React.useRef<HTMLDivElement>(null);
  const posicao = usePosicaoJuntoDaPalavra(ancora, ref);
  useFecharAoSair(ref, onFechar);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Conferir “${d.lido}”`}
      data-testid="duvida-editor"
      data-lado={posicao?.lado}
      className={cn(
        "fixed z-50 flex max-h-[calc(100dvh-1rem)] w-[min(22rem,calc(100vw-1rem))] flex-wrap items-center gap-2 overflow-y-auto rounded-lg border bg-card p-3 text-sm shadow-lg",
        !posicao && "invisible",
      )}
      style={{ left: posicao?.x ?? 0, top: posicao?.y ?? 0 }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute size-3 -translate-x-1/2 rotate-45 border-border bg-card",
          posicao?.lado === "abaixo" ? "-top-1.5 border-t border-l" : "-bottom-1.5 border-r border-b",
        )}
        style={{ left: posicao?.seta }}
      />
      <span className="text-muted-foreground">Lido como “{d.lido}”. Você escreveu:</span>
      {d.sugestoes.map((s, j) => (
        <Button key={s} size="sm" variant="outline" onClick={() => onEscolher(s)} data-testid={`duvida-sugestao-${j}`}>{s}</Button>
      ))}
      <Button size="sm" variant="ghost" className="h-auto min-h-8 whitespace-normal py-1" onClick={() => onEscolher(d.lido)} title="Use se foi exatamente assim que você escreveu na folha" data-testid="duvida-manter">
        escrevi assim: “{d.lido}”
      </Button>
      <div className="flex w-full min-w-0 gap-1.5">
        <Input value={valor} onChange={(e) => setValor(e.target.value)} className="h-8 min-w-0 flex-1" aria-label="Outra palavra" data-testid="duvida-input" />
        <Button size="sm" variant="secondary" onClick={() => onEscolher(valor)} data-testid="duvida-ok">OK</Button>
      </div>
    </div>
  );
}

function OpcaoImportar({ icone: Icone, titulo, sub, onClick, testId }: { icone: React.ComponentType<{ className?: string }>; titulo: string; sub: string; onClick: () => void; testId: string }) {
  return (
    <button type="button" onClick={onClick} data-testid={testId} className="grid cursor-pointer justify-items-center gap-1 rounded-xl border bg-card px-2 py-4 text-center text-sm font-semibold transition-colors hover:border-primary hover:bg-secondary/50">
      <Icone className="size-6 text-primary" />
      {titulo}
      <span className="text-xs font-normal text-muted-foreground">{sub}</span>
    </button>
  );
}

function Status({ ocupado, erro }: { ocupado: string | null; erro: string | null }) {
  if (!ocupado && !erro) return null;
  return (
    <p role="status" data-testid="envio-status" className={cn("flex items-center gap-2 text-sm", erro ? "text-destructive" : "text-muted-foreground")}>
      {ocupado && <Spinner />}
      {ocupado ?? erro}
    </p>
  );
}
