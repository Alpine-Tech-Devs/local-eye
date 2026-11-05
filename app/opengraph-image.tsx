import { ImageResponse } from "next/og";

export const alt =
  "Local Eye — family-friendly events in Seacoast Maine and New Hampshire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background:
          "linear-gradient(135deg, #eff6ff 0%, #ffffff 52%, #dbeafe 100%)",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div style={{ color: "#1d4ed8", fontSize: 32, fontWeight: 700 }}>
        LOCAL EYE
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.15,
          marginTop: 24,
          textAlign: "center",
        }}
      >
        Find something fun to do nearby.
      </div>
      <div
        style={{
          color: "#475569",
          fontSize: 30,
          marginTop: 24,
        }}
      >
        Seacoast Maine &amp; New Hampshire
      </div>
    </div>,
    size,
  );
}
