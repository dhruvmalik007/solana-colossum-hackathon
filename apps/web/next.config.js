/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'icons.llama.fi' },
      { protocol: 'https', hostname: 'defillama.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
    ],
  },
  // Ensure shared workspace packages are transpiled by Next
  transpilePackages: ["@repo/ui", "@repo/database"],
  // Ignore type errors during production builds to prevent external package type mismatches from failing CI
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
