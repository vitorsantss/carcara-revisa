import * as React from "react";
import {
  BarChart3, BookOpen, Building2, ClipboardList, FilePen, GraduationCap, Inbox, Menu, Settings,
  ShieldCheck, Sparkles, Users, UserRound, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navegar, type Rota } from "@/lib/router";
import { useApp } from "@/store/app-store";
import { ALUNOS, INSTITUICAO, PROFESSORES, USUARIO_ALUNO, USUARIO_PROFESSOR } from "@/domain/seed";
import { Avatar } from "@/components/ui/misc";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type { Papel } from "@/domain/types";

interface ItemMenu {
  rota: string;
  titulo: string;
  icone: React.ComponentType<{ className?: string }>;
  pendente?: boolean;
  testId: string;
}
interface GrupoMenu {
  titulo: string;
  papel: Papel;
  itens: ItemMenu[];
}

export const MENU: GrupoMenu[] = [
  {
    titulo: "Aluno",
    papel: "aluno",
    itens: [
      { rota: "/aluno/enviar", titulo: "Enviar redação", icone: FilePen, testId: "nav-aluno-enviar" },
      { rota: "/aluno/redacoes", titulo: "Minhas redações", icone: ClipboardList, testId: "nav-aluno-redacoes" },
      { rota: "/aluno/privacidade", titulo: "Privacidade e uso de IA", icone: ShieldCheck, testId: "nav-aluno-privacidade" },
    ],
  },
  {
    titulo: "Professor",
    papel: "professor",
    itens: [
      { rota: "/professor/fila", titulo: "Fila de correção", icone: Inbox, testId: "nav-professor-fila" },
      { rota: "/pendente/turmas", titulo: "Minhas turmas", icone: Users, pendente: true, testId: "nav-professor-turmas" },
      { rota: "/pendente/propostas", titulo: "Propostas", icone: BookOpen, pendente: true, testId: "nav-professor-propostas" },
      { rota: "/pendente/desempenho", titulo: "Desempenho", icone: BarChart3, pendente: true, testId: "nav-professor-desempenho" },
    ],
  },
  {
    titulo: "Instituição",
    papel: "professor",
    itens: [
      { rota: "/pendente/instituicao", titulo: "Visão geral", icone: Building2, pendente: true, testId: "nav-instituicao-geral" },
      { rota: "/pendente/professores", titulo: "Professores", icone: GraduationCap, pendente: true, testId: "nav-instituicao-professores" },
      { rota: "/pendente/alunos", titulo: "Alunos", icone: UserRound, pendente: true, testId: "nav-instituicao-alunos" },
      { rota: "/pendente/configuracoes", titulo: "Configurações", icone: Settings, pendente: true, testId: "nav-instituicao-configuracoes" },
    ],
  },
  {
    titulo: "Equipe",
    papel: "professor",
    itens: [{ rota: "/bastidores", titulo: "Bastidores", icone: Sparkles, testId: "nav-bastidores" }],
  },
];

function papelDaRota(rota: Rota): Papel | undefined {
  const [inicio] = rota.segmentos;
  if (inicio === "aluno") return "aluno";
  if (inicio === "professor" || inicio === "pendente" || inicio === "bastidores") return "professor";
  if (inicio === "redacoes") return rota.params.get("visao") === "professor" ? "professor" : "aluno";
  return undefined;
}

export function AppShell({ rota, titulo, acoes, children }: { rota: Rota; titulo: string; acoes?: React.ReactNode; children: React.ReactNode }) {
  const { estado, despachar } = useApp();
  const [aberto, setAberto] = React.useState(false);
  const papelDaPagina = papelDaRota(rota);
  const papel = papelDaPagina ?? estado.papel;

  React.useEffect(() => {
    if (papelDaPagina && papelDaPagina !== estado.papel) despachar({ type: "definir_papel", papel: papelDaPagina });
  }, [papelDaPagina, estado.papel, despachar]);

  const usuario =
    papel === "aluno"
      ? ALUNOS.find((a) => a.id === USUARIO_ALUNO)!.nome
      : `Prof. ${PROFESSORES.find((p) => p.id === USUARIO_PROFESSOR)!.nome}`;

  const trocarPapel = (p: string) => {
    despachar({ type: "definir_papel", papel: p as Papel });
    setAberto(false);
    const [inicio, id] = rota.segmentos;
    if (inicio === "redacoes" && id) navegar(`/redacoes/${id}?visao=${p}`);
    else navegar(p === "aluno" ? "/aluno/enviar" : "/professor/fila");
  };

  return (
    <div className="flex min-h-full" data-testid="app-shell">
      <aside
        data-testid="sidebar"
        data-print="hide"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          aberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <a href={papel === "aluno" ? "#/aluno/enviar" : "#/professor/fila"} className="flex items-center gap-2 font-extrabold tracking-tight text-sidebar-strong" data-testid="brand">
            <span className="flex gap-0.5" aria-hidden="true">
              <i className="h-4 w-1.5 rounded-sm bg-acerto" />
              <i className="h-4 w-1.5 rounded-sm bg-atencao" />
              <i className="h-4 w-1.5 rounded-sm bg-erro" />
            </span>
            Carcará Revisa
          </a>
          <button className="-mr-2 grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-sidebar-hover md:hidden" aria-label="Fechar menu" onClick={() => setAberto(false)} data-testid="sidebar-fechar">
            <X className="size-5" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">Entrar como</div>
          <ToggleGroup
            type="single"
            aria-label="Papel"
            data-testid="papel-toggle"
            value={papel}
            onValueChange={trocarPapel}
            className="w-full border-sidebar-border bg-sidebar-hover [&>button]:flex-1 [&>button]:justify-center [&>button]:text-sidebar-foreground [&>button[data-state=on]]:bg-highlight [&>button[data-state=on]]:text-brand-900"
            items={[
              { value: "aluno", label: "Aluno", testId: "papel-aluno" },
              { value: "professor", label: "Professor", testId: "papel-professor" },
            ]}
          />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6" aria-label="Menu principal">
          {MENU.filter((g) => g.papel === papel).map((g) => (
            <div key={g.titulo} data-testid={`nav-grupo-${g.titulo.toLowerCase()}`}>
              <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">{g.titulo}</div>
              <ul className="space-y-0.5">
                {g.itens.map((it) => {
                  const ativo = rota.path === it.rota || (it.rota === "/professor/fila" && rota.path.startsWith("/redacoes") && papel === "professor");
                  return (
                    <li key={it.rota}>
                      <a
                        href={`#${it.rota}`}
                        onClick={() => setAberto(false)}
                        data-testid={it.testId}
                        aria-current={ativo ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-hover hover:text-sidebar-strong",
                          ativo && "bg-sidebar-active text-sidebar-strong",
                        )}
                      >
                        <it.icone className="size-4 opacity-80" />
                        <span className="flex-1">{it.titulo}</span>
                        {it.pendente && <span className="rounded bg-sidebar-border px-1.5 py-0.5 text-[10px] text-sidebar-muted">em breve</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4" data-testid="usuario-atual">
          <Avatar nome={usuario.replace("Prof. ", "")} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-sidebar-strong">{usuario}</div>
            <div className="truncate text-xs text-sidebar-muted">{INSTITUICAO.nome}</div>
          </div>
        </div>
      </aside>
      {aberto && <div className="fixed inset-0 z-30 bg-overlay md:hidden" onClick={() => setAberto(false)} aria-hidden="true" />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header data-print="hide" className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <button className="-ml-2 grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-muted md:hidden" aria-label="Abrir menu" onClick={() => setAberto(true)} data-testid="sidebar-abrir">
            <Menu className="size-5" />
          </button>
          <h1 className="truncate text-base font-bold" data-testid="pagina-titulo">{titulo}</h1>
          <div className="ml-auto flex items-center gap-2">{acoes}</div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
