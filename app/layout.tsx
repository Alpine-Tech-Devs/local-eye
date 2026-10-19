import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Eye",
  description: "Discover kid-friendly events and activities near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
