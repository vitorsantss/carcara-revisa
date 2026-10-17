import * as React from "react";
import { Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { melhorCompetencia, mensagemMotivadora, notaTotal, notasPorCompetencia } from "@/domain/regras";
import type { Proposta, Redacao } from "@/domain/types";
import { cn } from "@/lib/utils";
import { MODELOS_STORY, Story, useLargura, type DadosStory, type ModeloStory } from "./story";

const LARGURA_IMAGEM = 1080;
const ALTURA_IMAGEM = 1920;

interface StoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redacao: Redacao;
  /** Versões devolvidas até a redação aberta. */
  historico: Redacao[];
  proposta: Pick<Proposta, "temaCurto">;
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/** Escolha do modelo de story, prévia lado a lado e geração do PNG 1080 × 1920 no próprio aparelho. */
export function StoriesDialog({ open, onOpenChange, redacao, historico, proposta }: StoriesDialogProps) {
  const [modelo, setModelo] = React.useState<ModeloStory>("evolucao");
  const [mostrarNota, setMostrarNota] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [gerando, setGerando] = React.useState(false);
  const renderRef = React.useRef<HTMLDivElement>(null);

  const notas = notasPorCompetencia(redacao);
  const dados: DadosStory = {
    tema: proposta.temaCurto,
    notas,
    total: notaTotal(redacao),
    melhor: melhorCompetencia(notas),
    totais: historico.map(notaTotal),
    mensagem: mensagemMotivadora(historico),
  };
  const nomeArquivo = `carcara-story-${modelo}.png`;

  async function gerarImagem() {
    const no = renderRef.current;
    if (!no) return null;
    const { toBlob } = await import("html-to-image");
    return toBlob(no, { width: LARGURA_IMAGEM, height: ALTURA_IMAGEM, pixelRatio: 1, cacheBust: true });
  }

  async function executar(acao: "salvar" | "postar") {
    setGerando(true);
    setStatus(null);
    try {
      const blob = await gerarImagem();
      if (!blob) throw new Error("imagem vazia");
      const arquivo = new File([blob], nomeArquivo, { type: "image/png" });
      if (acao === "postar" && navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: "Meu progresso no Carcará Revisa" });
        setStatus("Pronto! Escolha o Instagram e poste no story.");
      } else {
        baixar(blob, nomeArquivo);
        setStatus(acao === "postar" ? "Seu aparelho não compartilha direto daqui: a imagem foi salva para você postar." : "Imagem salva (1080 × 1920).");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setStatus("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" data-testid="story-dialog" fecharTestId="story-fechar">
        <DialogHeader>
          <DialogTitle>Compartilhar no story</DialogTitle>
          <DialogDescription>Escolha um modelo. A imagem sai no formato do Instagram (1080 × 1920).</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Modelo do story">
          {MODELOS_STORY.map((m) => (
            <PreviaStory key={m.id} id={m.id} rotulo={m.rotulo} selecionado={modelo === m.id} onSelecionar={() => setModelo(m.id)} dados={dados} mostrarNota={mostrarNota} />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Checkbox checked={mostrarNota} onCheckedChange={setMostrarNota} label="Mostrar minha nota" data-testid="story-mostrar-nota" />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={gerando} onClick={() => executar("salvar")} data-testid="story-salvar">
              <Download /> Salvar imagem
            </Button>
            <Button disabled={gerando} onClick={() => executar("postar")} data-testid="story-postar">
              <Send /> Postar no story
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">O texto da sua redação nunca aparece. A nota fica escondida, a menos que você marque a opção.</p>
        {status && <p role="status" className="mt-2 text-sm font-semibold text-primary" data-testid="story-status">{status}</p>}

        <div aria-hidden="true" className="pointer-events-none fixed top-0 -left-[20000px]">
          <div ref={renderRef} data-testid="story-render" data-modelo={modelo}>
            <Story modelo={modelo} dados={dados} mostrarNota={mostrarNota} largura={LARGURA_IMAGEM} animar={false} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PreviaStoryProps {
  id: ModeloStory;
  rotulo: string;
  selecionado: boolean;
  onSelecionar: () => void;
  dados: DadosStory;
  mostrarNota: boolean;
}

function PreviaStory({ id, rotulo, selecionado, onSelecionar, dados, mostrarNota }: PreviaStoryProps) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="grid gap-1.5">
      <button
        type="button"
        aria-pressed={selecionado}
        aria-label={rotulo}
        onClick={onSelecionar}
        data-testid={`story-${id}`}
        className={cn(
          "cursor-pointer overflow-hidden rounded-2xl border-[3px] border-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          selecionado && "border-highlight",
        )}
      >
        <div ref={ref} className="aspect-[9/16] w-full">
          {largura > 0 && <Story modelo={id} dados={dados} mostrarNota={mostrarNota} largura={largura} />}
        </div>
      </button>
      <span className={cn("text-center text-xs font-semibold", selecionado ? "text-foreground" : "text-muted-foreground")}>{rotulo}</span>
    </div>
  );
}
