import { ImageResponse } from "next/og";

export const alt =
  "Little Plans Around Here — big fun, close to home. Family-friendly things to do in Seacoast Maine and New Hampshire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background:
          "linear-gradient(135deg, #ffedd5 0%, #ffffff 50%, #fef3c7 100%)",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div style={{ color: "#ea580c", fontSize: 32, fontWeight: 700 }}>
        LITTLE PLANS AROUND HERE
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
        Big fun, close to home.
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
