import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking during build to prevent API route prerendering issues
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Ensure API routes are not statically generated
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
