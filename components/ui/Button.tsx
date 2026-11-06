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
      ? "bg-brand text-white shadow-md shadow-orange-200/70 hover:shadow-lg hover:shadow-orange-200 hover:brightness-105 focus-visible:outline-orange-500"
      : "border border-slate-300 bg-white text-slate-800 hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-orange-500";

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-[filter,box-shadow,background-color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70 ${variantClass} ${className}`}
      {...props}
    />
  );
}
