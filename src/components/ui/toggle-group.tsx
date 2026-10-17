import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Grupo de botões alternáveis no estilo shadcn ToggleGroup.
 * type="single": um valor; type="multiple": vários.
 */
interface Item {
  value: string;
  label: React.ReactNode;
  testId?: string;
}

interface SingleProps {
  type: "single";
  value: string;
  onValueChange: (v: string) => void;
}
interface MultipleProps {
  type: "multiple";
  value: string[];
  onValueChange: (v: string[]) => void;
}

type ToggleGroupProps = (SingleProps | MultipleProps) & {
  items: Item[];
  className?: string;
  size?: "sm" | "default";
  "aria-label": string;
  "data-testid"?: string;
};

export function ToggleGroup(props: ToggleGroupProps) {
  const { items, className, size = "default" } = props;
  const isOn = (v: string) => (props.type === "single" ? props.value === v : props.value.includes(v));
  const toggle = (v: string) => {
    if (props.type === "single") props.onValueChange(v);
    else props.onValueChange(isOn(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
  };
  return (
    <div
      role="group"
      aria-label={props["aria-label"]}
      data-testid={props["data-testid"]}
      className={cn("inline-flex flex-wrap rounded-lg border bg-card p-0.5", className)}
    >
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          aria-pressed={isOn(it.value)}
          data-state={isOn(it.value) ? "on" : "off"}
          data-testid={it.testId}
          onClick={() => toggle(it.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md font-medium text-muted-foreground transition-colors cursor-pointer",
            "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
