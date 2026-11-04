import { Eye } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <Link
          aria-label="Local Eye home"
          className="inline-flex items-center gap-2 text-slate-900"
          href="/"
        >
          <Eye aria-hidden="true" className="size-5 text-blue-700" />
          <span className="text-base font-semibold tracking-tight">
            Local Eye
          </span>
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700"
          href="/saved"
        >
          Saved
        </Link>
      </nav>
    </header>
  );
}
