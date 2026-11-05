import { ImageResponse } from "next/og";

import { getPublishedEvent } from "@/lib/events/get-published-event";

export const alt =
  "A family-friendly event in Seacoast Maine and New Hampshire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getPublishedEvent(id);

  return new ImageResponse(
    <div
      style={{
        alignItems: "flex-start",
        background:
          "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #dbeafe 100%)",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "76px",
        width: "100%",
      }}
    >
      <div style={{ color: "#1d4ed8", fontSize: 28, fontWeight: 700 }}>
        LOCAL EYE · {event?.category ?? "LOCAL EVENT"}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 60,
          fontWeight: 700,
          lineHeight: 1.12,
          marginTop: 28,
          maxHeight: 270,
          overflow: "hidden",
        }}
      >
        {event?.title ?? "Local family event"}
      </div>
      <div style={{ color: "#475569", fontSize: 32, marginTop: 30 }}>
        {event
          ? `${event.venueName} · ${event.city}, ${event.state}`
          : "Seacoast Maine & New Hampshire"}
      </div>
    </div>,
    size,
  );
}
