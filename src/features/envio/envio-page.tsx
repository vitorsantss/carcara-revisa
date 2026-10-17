import * as React from "react";
import { Camera, ClipboardPaste, ImageIcon, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { useApp } from "@/store/app-store";
import { navegar } from "@/lib/router";
import { correcaoSimulada, transcricaoSimulada } from "@/services/correcao";
import { montarRedacao } from "@/domain/regras";
import { PROPOSTA, USUARIO_ALUNO } from "@/domain/seed";
import { cn } from "@/lib/utils";

interface Duvida {
  id: number;
  lido: string;
  atual: string;
  sugestoes: string[];
  conferida: boolean;
}
type Etapa = "importar" | "colar" | "conferir";

export function EnvioPage() {
  const { estado, despachar } = useApp();
  const [etapa, setEtapa] = React.useState<Etapa>("importar");
  const [texto, setTexto] = React.useState("");
  const [duvidas, setDuvidas] = React.useState<Duvida[]>([]);
  const [aberta, setAberta] = React.useState<{ id: number; ancora: HTMLElement } | null>(null);
  const [origem, setOrigem] = React.useState<"foto" | "texto">("foto");
  const [ocupado, setOcupado] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const camRef = React.useRef<HTMLInputElement>(null);
  const galRef = React.useRef<HTMLInputElement>(null);

  async function transcrever(arquivo: File | "exemplo") {
    setErro(null);
    setOcupado("Lendo a folha…");
    const r = await transcricaoSimulada.transcrever(arquivo);
    setTexto(r.texto);
    setDuvidas(r.duvidas.map((d, i) => ({ id: i, lido: d.lido, atual: d.lido, sugestoes: d.sugestoes, conferida: false })));
    setOrigem("foto");
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

  async function enviar() {
    const limpo = texto
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^(nome|aluno|aluna|turma|matr[ií]cula|e-?mail|telefone)\s*[:\-]/i.test(l))
      .join("\n");
    if (limpo.length < 120) {
      setErro("Texto curto demais para enviar.");
      return;
    }
    setOcupado("Enviando…");
    const resultado = await correcaoSimulada.corrigir(limpo, PROPOSTA.tema);
    const id = `r-${Date.now()}`;
    const redacao = montarRedacao(
      { id, alunoId: USUARIO_ALUNO, propostaId: PROPOSTA.id, texto: limpo, enviadaEm: new Date().toISOString(), versao: 1, etapa: "enviada", duvidasDeTranscricao: duvidas.length },
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

  return (
    <div className="mx-auto max-w-xl" data-testid="envio-page">
      <Card className="rounded-2xl">
        {etapa === "importar" && (
          <>
            <CardHeader>
              <CardTitle>Enviar redação</CardTitle>
              <CardDescription data-testid="envio-tema">{PROPOSTA.tema}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-2">
                <OpcaoImportar icone={Camera} titulo="Tirar foto" sub="da folha" testId="envio-importar-camera" onClick={() => camRef.current?.click()} />
                <OpcaoImportar icone={ImageIcon} titulo="Imagem" sub="da galeria" testId="envio-importar-galeria" onClick={() => galRef.current?.click()} />
                <OpcaoImportar icone={ClipboardPaste} titulo="Colar texto" sub="já digitado" testId="envio-importar-colar" onClick={() => setEtapa("colar")} />
              </div>
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" data-testid="envio-input-camera" onChange={(e) => e.target.files?.[0] && transcrever(e.target.files[0])} />
              <input ref={galRef} type="file" accept="image/*,application/pdf" className="hidden" data-testid="envio-input-galeria" onChange={(e) => e.target.files?.[0] && transcrever(e.target.files[0])} />
              <Button variant="outline" onClick={() => transcrever("exemplo")} data-testid="envio-usar-exemplo">
                <ScanText /> Usar folha de exemplo
              </Button>
              <Status ocupado={ocupado} erro={erro} />
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
                <Button onClick={() => { setDuvidas([]); setOrigem("texto"); setEtapa("conferir"); }} disabled={!texto.trim()} data-testid="envio-colar-continuar">Continuar</Button>
              </div>
            </CardContent>
          </>
        )}

        {etapa === "conferir" && (
          <>
            <CardHeader>
              <CardTitle>Confira a transcrição</CardTitle>
              <CardDescription data-testid="transcricao-resumo">
                {origem === "texto"
                  ? "Confira o texto antes de enviar."
                  : abertas
                    ? `${abertas} palavra${abertas > 1 ? "s" : ""} em amarelo: a leitura da sua letra não teve certeza. Toque para confirmar.`
                    : "Tudo conferido. Seus próprios erros de escrita continuam no texto: eles fazem parte da correção."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="max-h-[420px] overflow-auto rounded-lg border px-4 py-3 font-serif text-[15.5px] leading-[1.85]" data-testid="transcricao">
                {texto.split("\n").filter((p) => p.trim()).map((p, pi) => (
                  <p key={pi} className="mb-2.5">{renderComDuvidas(p, duvidas, alternarDuvida)}</p>
                ))}
              </div>
              {duvidaAberta && aberta && (
                <EditorDuvida key={duvidaAberta.id} d={duvidaAberta} ancora={aberta.ancora} onEscolher={(v) => trocar(duvidaAberta, v)} onFechar={() => setAberta(null)} />
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setEtapa("importar")} data-testid="envio-voltar">Voltar</Button>
                <Button onClick={enviar} disabled={abertas > 0 || !!ocupado} data-testid="envio-enviar">Enviar para correção</Button>
              </div>
              <Status ocupado={ocupado} erro={erro} />
            </CardContent>
          </>
        )}
      </Card>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Linhas com nome, e-mail ou telefone são removidas antes do envio. A redação não é usada para treinar modelos.
      </p>
    </div>
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
  return {
    x,
    y: cabeAcima ? palavra.top - DISTANCIA_DA_PALAVRA - altura : palavra.bottom + DISTANCIA_DA_PALAVRA,
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
        "fixed z-50 flex w-[min(22rem,calc(100vw-1rem))] flex-wrap items-center gap-2 rounded-lg border bg-card p-3 text-sm shadow-lg",
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
      <Button size="sm" variant="ghost" onClick={() => onEscolher(d.lido)} data-testid="duvida-manter">manter “{d.lido}”</Button>
      <div className="flex gap-1.5">
        <Input value={valor} onChange={(e) => setValor(e.target.value)} className="h-8 w-40" aria-label="Outra palavra" data-testid="duvida-input" />
        <Button size="sm" variant="secondary" onClick={() => onEscolher(valor)} data-testid="duvida-ok">OK</Button>
      </div>
    </div>
  );
}

function OpcaoImportar({ icone: Icone, titulo, sub, onClick, testId }: { icone: React.ComponentType<{ className?: string }>; titulo: string; sub: string; onClick: () => void; testId: string }) {
  return (
    <button type="button" onClick={onClick} data-testid={testId} className="grid cursor-pointer justify-items-center gap-1 rounded-xl border bg-card px-2 py-4 text-sm font-semibold hover:border-primary hover:bg-secondary/50">
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
