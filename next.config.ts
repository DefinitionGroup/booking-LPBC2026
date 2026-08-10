import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: '/building',
        destination: '/admin/buildings',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
