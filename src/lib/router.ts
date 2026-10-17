import { useEffect, useState } from "react";

/**
 * Roteador por hash, sem dependências. Suficiente para o MVP e estável
 * para testes e2e (as URLs são /#/rota?param=valor).
 */
export interface Rota {
  path: string;
  segmentos: string[];
  params: URLSearchParams;
}

function lerRota(): Rota {
  const hash = window.location.hash.replace(/^#/, "") || "/aluno/enviar";
  const [path, query = ""] = hash.split("?");
  return { path, segmentos: path.split("/").filter(Boolean), params: new URLSearchParams(query) };
}

export function useRota(): Rota {
  const [rota, setRota] = useState<Rota>(lerRota);
  useEffect(() => {
    const onChange = () => setRota(lerRota());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return rota;
}

export function navegar(path: string) {
  window.location.hash = path;
}
