import * as React from "react";
import { cn } from "@/lib/utils";

/** Checkbox nativo com rótulo, no espírito do shadcn Checkbox (checked + onCheckedChange). */
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
}

export function Checkbox({ checked, onCheckedChange, label, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm font-semibold", className)}>
      <input
        type="checkbox"
        className="size-4 cursor-pointer rounded border-input accent-primary"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        {...props}
      />
      {label}
    </label>
  );
}
