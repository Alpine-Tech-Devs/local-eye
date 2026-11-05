"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/track";

const SESSION_STARTED_KEY = "local-eye:analytics-session-started";

export function SessionStartTracker() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_STARTED_KEY)) return;
      window.sessionStorage.setItem(SESSION_STARTED_KEY, "true");
      trackAnalyticsEvent("session_start");
    } catch (error) {
      console.error("Could not record the anonymous session start.", error);
    }
  }, []);

  return null;
}
