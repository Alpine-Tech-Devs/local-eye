"use client";

import { RouteError } from "@/components/RouteError";

export default function EventError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      message="We couldn’t load this event. Try again, or return to search for other local ideas."
      retry={retry}
      title="This event isn’t available right now"
    />
  );
}
