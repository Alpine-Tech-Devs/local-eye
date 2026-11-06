import { BookOpen, ExternalLink } from "lucide-react";

export const LITTLE_BAY_MOUSE_URL = "https://www.instagram.com/littlebaymouse/";

interface AtHomeCalloutProps {
  className?: string;
}

export function AtHomeCallout({ className = "" }: AtHomeCalloutProps) {
  return (
    <aside
      aria-label="At-home activity ideas"
      className={`flex items-start gap-3 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600 ${className}`}
    >
      <BookOpen
        aria-hidden="true"
        className="mt-1 size-4 shrink-0 text-slate-400"
      />
      <p>
        Rainy day? Looking for something to do at home? Little Bay Mouse, a
        retired children&apos;s librarian, shares a book, craft, and rhyme every
        Monday.{" "}
        <a
          className="inline-flex items-center gap-1 font-medium text-orange-700 underline decoration-orange-200 underline-offset-4 hover:text-orange-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          href={LITTLE_BAY_MOUSE_URL}
          rel="noreferrer"
          target="_blank"
        >
          See this week on Instagram
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      </p>
    </aside>
  );
}
