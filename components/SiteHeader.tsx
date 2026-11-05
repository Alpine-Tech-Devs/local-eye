import { Map } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-orange-100/80 bg-white/70 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8"
      >
        <Link
          aria-label="Little Plans Around Here home"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-slate-900 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          href="/"
        >
          <span
            aria-hidden="true"
            className="bg-brand inline-flex size-7 items-center justify-center rounded-lg text-white shadow-sm shadow-orange-200"
          >
            <Map className="size-4" strokeWidth={2.25} />
          </span>
          <span className="text-brand text-base font-bold tracking-tight">
            Little Plans Around Here
          </span>
        </Link>
      </nav>
    </header>
  );
}
