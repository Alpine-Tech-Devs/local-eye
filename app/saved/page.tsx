import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { SavedEvents } from "@/components/events/SavedEvents";
import { SiteHeader } from "@/components/SiteHeader";

export default function SavedPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-700"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to search
        </Link>
        <div className="mb-8 mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Saved events
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Events you save on this device will appear here.
          </p>
        </div>
        <SavedEvents />
      </main>
    </div>
  );
}
