import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Diálogo no estilo shadcn Dialog, sem Radix: portal, fundo escurecido,
 * fecha com Esc ou clicando fora e devolve o foco ao fechar.
 */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogCtx = React.createContext<{ fechar: () => void; tituloId: string }>({ fechar: () => {}, tituloId: "" });

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const tituloId = React.useId();
  React.useEffect(() => {
    if (!open) return;
    const anterior = document.activeElement as HTMLElement | null;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, [open, onOpenChange]);

  if (!open) return null;
  return createPortal(
    <DialogCtx.Provider value={{ fechar: () => onOpenChange(false), tituloId }}>
      <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" data-print="hide" onMouseDown={(e) => e.target === e.currentTarget && onOpenChange(false)}>
        {children}
      </div>
    </DialogCtx.Provider>,
    document.body,
  );
}

export function DialogContent({ className, children, fecharTestId, ...props }: React.HTMLAttributes<HTMLDivElement> & { fecharTestId?: string }) {
  const { fechar, tituloId } = React.useContext(DialogCtx);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => ref.current?.focus(), []);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      tabIndex={-1}
      className={cn("relative max-h-full w-full max-w-lg overflow-auto rounded-2xl border bg-card p-5 shadow-lg outline-none", className)}
      {...props}
    >
      {children}
      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar"
        className="absolute right-4 top-4 grid size-8 cursor-pointer place-items-center rounded-full bg-muted text-foreground hover:bg-secondary"
        data-testid={fecharTestId}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 grid gap-1 pr-10", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { tituloId } = React.useContext(DialogCtx);
  return <h2 id={tituloId} className={cn("text-lg font-extrabold tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
