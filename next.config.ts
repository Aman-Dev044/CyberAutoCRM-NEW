import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Two dev servers (API :2442 and web :2552) must not share a build folder —
  // they would overwrite each other's chunks. `scripts/dev.mjs` sets this.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['mongoose', 'bcryptjs'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
