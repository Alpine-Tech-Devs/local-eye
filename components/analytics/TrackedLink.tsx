"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/track";

interface TrackedLinkProps {
  href: string;
  eventType: "result_click";
  payload: { eventId: string; position: number };
  className?: string;
  children: ReactNode;
}

export function TrackedLink({
  href,
  eventType,
  payload,
  className,
  children,
}: TrackedLinkProps) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() =>
        trackAnalyticsEvent(eventType, {
          eventId: payload.eventId,
          position: payload.position,
        })
      }
    >
      {children}
    </Link>
  );
}

interface TrackedAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  eventType: "source_click" | "registration_click";
  eventId: string;
}

export function TrackedAnchor({
  eventType,
  eventId,
  onClick,
  ...props
}: TrackedAnchorProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        trackAnalyticsEvent(eventType, { eventId });
      }}
    />
  );
}
