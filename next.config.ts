import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.PLAYWRIGHT_TEST ? ".next-e2e" : ".next",
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "librarycalendar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.librarycalendar.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
