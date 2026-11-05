import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";

export default function EventNotFound() {
  return (
    <div className="flex-1 text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-sm font-semibold text-orange-700">Event not found</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          This event may have ended or been removed.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Search again to find another family-friendly activity.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-orange-700 underline decoration-orange-200 underline-offset-4 hover:text-orange-900 focus-visible:outline-2 focus-visible:outline-orange-500"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to search
        </Link>
      </main>
    </div>
  );
}
