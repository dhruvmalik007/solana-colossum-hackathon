/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for optimized builds and reduced memory footprint
  output: 'standalone',
  
  // Disable production source maps to reduce memory usage during build
  productionBrowserSourceMaps: false,
  async headers() {
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ];
    if (process.env.ENFORCE_HTTPS === '1') {
      headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' });
    }
    return [
      {
        source: '/:path*',
        headers,
      },
    ];
  },
  
  // Optional redirect to local HTTPS (e.g., https://localhost:3443) when developing
  async redirects() {
    if (process.env.LOCAL_HTTPS_REDIRECT === '1') {
      return [
        {
          source: '/:path*',
          destination: 'https://localhost:3443/:path*',
          permanent: false,
        },
      ];
    }
    return [];
  },
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'icons.llama.fi' },
      { protocol: 'https', hostname: 'defillama.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
    ],
  },
  
  // Ensure shared workspace packages are transpiled by Next
  transpilePackages: ["@repo/ui", "@repo/database"],
  
  // Experimental optimizations for lower memory usage
  experimental: {
    // Use optimized CSS processing
    optimizeCss: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production (except error and warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
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
