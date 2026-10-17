import * as React from "react";
import { cn, iniciais } from "@/lib/utils";

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn("bg-border", vertical ? "h-full w-px" : "h-px w-full", className)} />;
}

export function Avatar({ nome, className }: { nome: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-full bg-highlight text-xs font-bold text-brand-900",
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  );
}

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="status" className={cn("rounded-lg border bg-muted/60 px-4 py-3 text-sm text-muted-foreground", className)} {...props} />
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{children}</kbd>;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-border border-t-primary", className)}
    />
  );
}
