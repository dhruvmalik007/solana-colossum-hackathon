/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
