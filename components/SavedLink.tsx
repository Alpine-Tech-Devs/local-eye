"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  SAVED_EVENTS_CHANGED_EVENT,
  readSavedEventIds,
} from "@/components/events/SaveButton";

function subscribe(onChange: () => void) {
  window.addEventListener(SAVED_EVENTS_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SAVED_EVENTS_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSavedCount() {
  try {
    return readSavedEventIds().length;
  } catch {
    return 0;
  }
}

interface SavedLinkProps {
  /** Set when rendered on the Saved page so the link shows as current. */
  isActive?: boolean;
}

export function SavedLink({ isActive = false }: SavedLinkProps) {
  const count = useSyncExternalStore(subscribe, getSavedCount, () => 0);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      aria-label={
        count > 0
          ? `Saved events, ${count} saved`
          : "Saved events"
      }
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
        isActive
          ? "bg-orange-50 text-orange-800"
          : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
      }`}
      href="/saved"
    >
      <Heart
        aria-hidden="true"
        className={`size-4 ${count > 0 ? "fill-orange-500 text-orange-500" : ""}`}
      />
      Saved
      {count > 0 && (
        <span
          aria-hidden="true"
          className="bg-brand ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-5 text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
