import { SiteHeader } from "@/components/SiteHeader";

export default function ResultsLoading() {
  return (
    <div
      aria-label="Loading local suggestions"
      aria-live="polite"
      className="flex-1"
      role="status"
    >
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12">
        <div className="h-11 w-36 animate-pulse rounded-lg bg-slate-100" />
        <div className="mb-8 mt-6 space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-orange-100" />
          <div className="h-9 w-64 max-w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <div
              aria-hidden="true"
              className="animate-pulse rounded-xl border border-slate-200 p-5 sm:p-6"
              key={item}
            >
              <div className="h-5 w-3/4 rounded bg-slate-100" />
              <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
              <div className="mt-6 h-4 w-2/3 rounded bg-slate-100" />
              <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
