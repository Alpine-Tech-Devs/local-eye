import { SiteHeader } from "@/components/SiteHeader";

export default function EventLoading() {
  return (
    <div className="flex-1">
      <SiteHeader />
      <main
        aria-label="Loading event details"
        aria-live="polite"
        className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12"
        role="status"
      >
        <div className="h-11 w-36 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-5 animate-pulse overflow-hidden rounded-2xl border border-slate-200 p-5 sm:p-8">
          <div className="h-8 w-2/3 rounded bg-slate-100" />
          <div className="mt-3 h-5 w-1/2 rounded bg-slate-100" />
          <div className="mt-8 h-20 rounded bg-slate-100" />
          <div className="mt-8 h-24 rounded bg-slate-100" />
        </div>
      </main>
    </div>
  );
}
