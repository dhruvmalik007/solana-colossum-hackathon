/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'icons.llama.fi' },
      { protocol: 'https', hostname: 'defillama.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
    ],
  },
};

export default nextConfig;
