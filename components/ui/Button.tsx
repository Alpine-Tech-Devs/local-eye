import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-blue-700 text-white shadow-sm hover:bg-blue-800 focus-visible:outline-blue-700"
      : "border border-slate-300 bg-white text-slate-800 hover:bg-blue-50 focus-visible:outline-blue-600";

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70 ${variantClass} ${className}`}
      {...props}
    />
  );
}
