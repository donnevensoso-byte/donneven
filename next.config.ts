import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autonome pour l'image Docker (STANDALONE=1 dans le Dockerfile).
  output: process.env.STANDALONE === "1" ? "standalone" : undefined,
  serverExternalPackages: ["sharp", "postgres"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Les photos sont envoyées via les server actions (réduites côté navigateur).
      bodySizeLimit: "30mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
