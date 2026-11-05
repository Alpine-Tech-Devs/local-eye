import type { Metadata, Viewport } from "next";
import { SessionStartTracker } from "@/components/analytics/SessionStartTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Eye",
  description: "Discover kid-friendly events and activities near you.",
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
