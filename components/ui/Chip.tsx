import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
};

export function Chip({
  className = "",
  selected,
  ...props
}: ChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
        selected
          ? "border-blue-700 bg-blue-700 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50"
      } ${className}`}
      {...props}
    />
  );
}
