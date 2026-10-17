import * as React from "react";
import { LinhaEvolucao, type CoresLinha } from "@/components/charts/linha-evolucao";
import { RadarCompetencias, type CoresRadar } from "@/components/charts/radar-competencias";
import type { MensagemMotivadora } from "@/domain/regras";
import type { Competencia, NotasCompetencias } from "@/domain/types";
import { cn, comSinal } from "@/lib/utils";

export type ModeloStory = "redacao" | "evolucao" | "mensagem";

export const MODELOS_STORY: Array<{ id: ModeloStory; rotulo: string }> = [
  { id: "redacao", rotulo: "Por redação" },
  { id: "evolucao", rotulo: "Por evolução" },
  { id: "mensagem", rotulo: "Mensagem" },
];

/** Só números, competências e o tema da proposta: nada do texto da redação entra aqui (ADR-0011). */
export interface DadosStory {
  tema: string;
  notas: NotasCompetencias;
  total: number;
  melhor: Competencia;
  totais: number[];
  mensagem: MensagemMotivadora;
}

const CORES_RADAR: CoresRadar = { principal: "story-destaque", referencia: "story-grade", grade: "story-grade", rotulo: "story-foreground", contorno: "story" };
const CORES_LINHA: CoresLinha = { linha: "story-destaque", rotulo: "story-foreground", destaque: "story-foreground" };

interface StoryProps {
  modelo: ModeloStory;
  dados: DadosStory;
  mostrarNota: boolean;
  /** Largura em px; tudo no story escala a partir dela (1080 na imagem final). */
  largura: number;
  animar?: boolean;
}

/** Um story 9:16 nas cores da marca. */
export function Story({ modelo, dados, mostrarNota, largura, animar = true }: StoryProps) {
  const u = largura / 100;
  const ganho = dados.totais.length > 1 ? dados.totais[dados.totais.length - 1] - dados.totais[0] : 0;
  const n = dados.totais.length;

  return (
    <div
      className="flex flex-col items-center justify-between overflow-hidden bg-story text-center font-sans text-story-foreground"
      style={{ width: largura, height: (largura * 16) / 9, padding: `${7 * u}px ${6 * u}px` }}
      data-modelo={modelo}
      data-mostra-nota={mostrarNota}
    >
      <span className="font-bold uppercase text-story-destaque" style={{ fontSize: 4.2 * u, letterSpacing: "0.08em" }}>
        {modelo === "redacao" ? "Minha redação" : modelo === "evolucao" ? "Minha evolução" : "Meu progresso"}
      </span>

      {modelo === "redacao" && (
        <>
          <div>
            <div className="font-extrabold leading-none" style={{ fontSize: 15 * u, letterSpacing: "-0.03em" }} data-testid="story-numero">
              {mostrarNota ? dados.total : `C${dados.melhor} ${dados.notas[dados.melhor - 1]}`}
            </div>
            <div className="opacity-80" style={{ fontSize: 4.4 * u, marginTop: 1.5 * u }} data-testid="story-legenda">
              {mostrarNota ? dados.tema : "melhor competência"}
            </div>
          </div>
          <RadarCompetencias tamanho={Math.round(78 * u)} rotulos={false} cores={CORES_RADAR} animar={animar} series={[{ valores: dados.notas, variante: "principal", nome: "Minhas competências" }]} />
        </>
      )}

      {modelo === "evolucao" && (
        <>
          <div>
            <div className="font-extrabold leading-none" style={{ fontSize: 17 * u, letterSpacing: "-0.03em" }} data-testid="story-numero">
              {comSinal(ganho)}
            </div>
            <div className="opacity-80" style={{ fontSize: 4.4 * u, marginTop: 1.5 * u }} data-testid="story-legenda">
              em {n} {n === 1 ? "redação" : "redações"}
            </div>
          </div>
          <LinhaEvolucao totais={dados.totais} rotulos={mostrarNota} largura={Math.round(84 * u)} altura={Math.round(46 * u)} cores={CORES_LINHA} animar={animar} />
        </>
      )}

      {modelo === "mensagem" && (
        <>
          <p className="font-serif italic" style={{ fontSize: 7 * u, lineHeight: 1.35 }} data-testid="story-frase">
            {dados.mensagem.frase}
          </p>
          <div className="flex flex-col items-center" style={{ gap: 2 * u }}>
            {dados.mensagem.selos.map((s) => (
              <span key={s} className="whitespace-nowrap rounded-full bg-story-selo font-bold" style={{ fontSize: 4.2 * u, padding: `${u}px ${3 * u}px` }}>
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      <span className="flex items-center font-bold" style={{ fontSize: 4.6 * u, gap: 1.6 * u }}>
        <span className="flex" style={{ gap: 0.6 * u }} aria-hidden="true">
          {["bg-acerto", "bg-atencao", "bg-erro"].map((c) => (
            <i key={c} className={cn("inline-block rounded-[1px]", c)} style={{ width: 1.6 * u, height: 4 * u }} />
          ))}
        </span>
        Carcará Revisa
      </span>
    </div>
  );
}

/** Largura atual do elemento, para a prévia escalar o story ao espaço disponível. */
export function useLargura<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [largura, setLargura] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new ResizeObserver(([e]) => setLargura(Math.floor(e.contentRect.width)));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);
  return [ref, largura] as const;
}
