"use client";

import { RouteError } from "@/components/RouteError";

export default function ResultsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      message="We couldn’t load local suggestions. Try again, or return to search and adjust your answers."
      retry={retry}
      title="Suggestions aren’t available right now"
    />
  );
}
