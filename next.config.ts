import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Allowed origins for Next.js dev resources (development only).
  // Include specific origins used on your LAN and localhost. Do NOT enable these in production.
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.201:3000',
    // Add host-only entry because Next's dev server may report origins without scheme
    '192.168.1.201',
  ],
  images: {
    remotePatterns: [],
    unoptimized: false,
  },
  // Disable Next.js dev overlay/devtools UI in development
  devIndicators: false,
  // Serve uploaded files
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
