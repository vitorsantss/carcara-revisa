import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const h = Math.round((agora.getTime() - new Date(iso).getTime()) / 36e5);
  if (h < 1) return "agora";
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}

export const dataCurta = (data: Date | string) =>
  new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export const dataHora = (data: Date | string) =>
  new Date(data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
