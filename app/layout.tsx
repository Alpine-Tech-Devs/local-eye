import type { Metadata, Viewport } from "next";
import { SessionStartTracker } from "@/components/analytics/SessionStartTracker";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteUrl } from "@/lib/seo/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Little Plans Around Here",
    template: "%s | Little Plans Around Here",
  },
  description:
    "Big fun, close to home. Find family-friendly things to do around here in Seacoast Maine and New Hampshire.",
  openGraph: {
    type: "website",
    siteName: "Little Plans Around Here",
    title: "Little Plans Around Here",
    description:
      "Big fun, close to home. Find family-friendly things to do around here in Seacoast Maine and New Hampshire.",
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
      <body className="flex min-h-screen flex-col antialiased">
        <SessionStartTracker />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
