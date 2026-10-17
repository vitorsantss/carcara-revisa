import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useRota } from "@/lib/router";
import { AppProvider } from "@/store/app-store";
import { EnvioPage } from "@/features/envio/envio-page";
import { FilaPage, MinhasRedacoesPage } from "@/features/fila/fila-page";
import { RedacaoPage } from "@/features/redacao/redacao-page";
import { BastidoresPage } from "@/features/bastidores/bastidores-page";
import { PendentePage, TELAS_PENDENTES } from "@/features/pendente/pendente-page";
import { PrivacidadePage } from "@/features/privacidade/privacidade-page";
import { DesempenhoPage } from "@/features/desempenho/desempenho-page";
import type { Papel } from "@/domain/types";

function Rotas() {
  const rota = useRota();
  const [a, b] = rota.segmentos;

  let titulo = "Carcará Revisa";
  let pagina: ReactNode;
  if (a === "aluno" && b === "redacoes") {
    titulo = "Minhas redações";
    pagina = <MinhasRedacoesPage />;
  } else if (a === "aluno" && b === "privacidade") {
    titulo = "Privacidade e uso de IA";
    pagina = <PrivacidadePage />;
  } else if (a === "professor" && b === "fila") {
    titulo = "Fila de correção";
    pagina = <FilaPage />;
  } else if (a === "professor" && b === "desempenho") {
    titulo = "Desempenho";
    pagina = <DesempenhoPage params={rota.params} />;
  } else if (a === "redacoes" && b) {
    const visao = (rota.params.get("visao") === "professor" ? "professor" : "aluno") as Papel;
    titulo = visao === "professor" ? "Revisão" : "Minha redação";
    pagina = <RedacaoPage key={b} id={b} visao={visao} />;
  } else if (a === "bastidores") {
    titulo = "Bastidores";
    pagina = <BastidoresPage />;
  } else if (a === "pendente" && b) {
    titulo = TELAS_PENDENTES[b]?.titulo ?? "Em breve";
    pagina = <PendentePage slug={b} />;
  } else {
    titulo = "Enviar redação";
    pagina = <EnvioPage key={rota.path} />;
  }

  return (
    <AppShell rota={rota} titulo={titulo}>
      {pagina}
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Rotas />
    </AppProvider>
  );
}
