"use client";

import { Heart } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

export const SAVED_EVENTS_KEY = "local-eye:saved-events";
export const SAVED_EVENTS_CHANGED_EVENT = "local-eye:saved-events-changed";

export function readSavedEventIds(): string[] {
  try {
    const stored = window.localStorage.getItem(SAVED_EVENTS_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (
      Array.isArray(parsed) &&
      parsed.every((id): id is string => typeof id === "string")
    ) {
      return parsed;
    }

    throw new Error("Saved event data has an invalid format.");
  } catch (error) {
    console.warn("Could not read saved events.", error);
    throw new Error("Could not read saved events from this device.", {
      cause: error,
    });
  }
}

function subscribeToSavedEvents(onChange: () => void) {
  window.addEventListener(SAVED_EVENTS_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SAVED_EVENTS_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function isEventSaved(eventId: string) {
  try {
    return readSavedEventIds().includes(eventId);
  } catch (error) {
    console.error("Could not check whether this event is saved.", error);
    return false;
  }
}

export function SaveButton({ eventId }: { eventId: string }) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const isSaved = useSyncExternalStore(
    subscribeToSavedEvents,
    () => isEventSaved(eventId),
    () => false,
  );

  function toggleSaved() {
    try {
      const savedIds = readSavedEventIds();
      const nextSavedIds = isSaved
        ? savedIds.filter((savedId) => savedId !== eventId)
        : [...new Set([...savedIds, eventId])];
      window.localStorage.setItem(
        SAVED_EVENTS_KEY,
        JSON.stringify(nextSavedIds),
      );
      setSaveError(null);
      window.dispatchEvent(new Event(SAVED_EVENTS_CHANGED_EVENT));
    } catch (error) {
      console.error("Could not save this event on this device.", error);
      setSaveError("Could not update saved events on this device.");
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end">
      <button
        aria-label={isSaved ? "Remove from saved events" : "Save event"}
        aria-pressed={isSaved}
        className="inline-flex size-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        onClick={toggleSaved}
        type="button"
      >
        <Heart
          aria-hidden="true"
          className={`size-5 ${isSaved ? "fill-blue-700 text-blue-700" : ""}`}
        />
      </button>
      {saveError && (
        <span
          className="mt-1 max-w-36 text-right text-xs text-red-700"
          role="alert"
        >
          {saveError}
        </span>
      )}
    </div>
  );
}
