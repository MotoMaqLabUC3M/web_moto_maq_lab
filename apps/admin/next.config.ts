import type { NextConfig } from "next";

const basePath = "/admin";

const nextConfig: NextConfig = {
  basePath,
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "@mantine/core", "@blocknote/core"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
