import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
