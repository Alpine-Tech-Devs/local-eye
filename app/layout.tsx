import type { Metadata, Viewport } from "next";
import { SessionStartTracker } from "@/components/analytics/SessionStartTracker";
import { getSiteUrl } from "@/lib/seo/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Local Eye",
    template: "%s | Local Eye",
  },
  description:
    "Find family-friendly events and activities in Seacoast Maine and New Hampshire.",
  openGraph: {
    type: "website",
    siteName: "Local Eye",
    title: "Local Eye",
    description:
      "Find family-friendly events and activities in Seacoast Maine and New Hampshire.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SessionStartTracker />
        {children}
      </body>
    </html>
  );
}
