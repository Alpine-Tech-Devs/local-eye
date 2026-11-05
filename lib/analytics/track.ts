"use client";

import { getAnonymousId } from "./anonId";
import type { AnalyticsEventType } from "./schema";

export type AnalyticsPayload = Record<string, unknown>;

export function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  payload: AnalyticsPayload = {},
): void {
  let body: string;

  try {
    body = JSON.stringify({
      anonId: getAnonymousId(),
      eventType,
      payload,
    });
  } catch (error) {
    console.error("Could not prepare anonymous analytics event.", error);
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) {
        console.warn(
          `Analytics request failed with status ${response.status}.`,
        );
      }
    })
    .catch((error: unknown) => {
      console.warn("Analytics request failed; trying sendBeacon.", error);
      try {
        const sent =
          typeof navigator.sendBeacon === "function" &&
          navigator.sendBeacon(
            "/api/analytics",
            new Blob([body], { type: "application/json" }),
          );
        if (!sent) {
          console.warn("Could not queue analytics event with sendBeacon.");
        }
      } catch (beaconError) {
        console.error(
          "Could not send analytics event with sendBeacon.",
          beaconError,
        );
      }
    });
}
