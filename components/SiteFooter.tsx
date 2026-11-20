import { ContactActions } from "@/components/ContactActions";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-orange-100/80 bg-white/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-8">
        <p>
          Powered by{" "}
          <a
            className="font-medium text-slate-600 underline decoration-orange-200 underline-offset-4 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            href="https://alpinetechdevs.com/"
            rel="noreferrer"
            target="_blank"
          >
            Alpine Technologies LLC
          </a>
        </p>
        <ContactActions compact />
      </div>
    </footer>
  );
}
