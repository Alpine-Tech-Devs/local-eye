import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className = "", selected, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
        selected
          ? "bg-brand border-transparent text-white shadow-sm shadow-orange-200"
          : "border-slate-300 bg-white text-slate-700 hover:border-orange-400 hover:bg-orange-50"
      } ${className}`}
      {...props}
    />
  );
});

Chip.displayName = "Chip";
