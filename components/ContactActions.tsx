export const CONTACT_EMAIL = "contactus@alpinetechdevs.com";

export const EVENT_SUGGESTION_HREF =
  "mailto:contactus@alpinetechdevs.com?subject=Event%20suggestion";
export const APP_FEEDBACK_HREF =
  "mailto:contactus@alpinetechdevs.com?subject=App%20feedback";

interface ContactActionsProps {
  className?: string;
  compact?: boolean;
}

export function ContactActions({
  className = "",
  compact = false,
}: ContactActionsProps) {
  const suggestionClassName = compact
    ? "border border-transparent text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
    : "bg-brand text-white shadow-md shadow-orange-200/70 hover:brightness-105";
  const feedbackClassName = compact
    ? "border border-transparent text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
    : "border border-slate-300 bg-white text-slate-800 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700";

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${className}`}
    >
      <a
        className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${suggestionClassName}`}
        href={EVENT_SUGGESTION_HREF}
      >
        Suggest an event
      </a>
      <a
        className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${feedbackClassName}`}
        href={APP_FEEDBACK_HREF}
      >
        Share an idea
      </a>
    </div>
  );
}
