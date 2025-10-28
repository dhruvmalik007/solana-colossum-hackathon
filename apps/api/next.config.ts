const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverExternalPackages: [
      "import-in-the-middle",
      "require-in-the-middle",
    ],
  },
};

export default nextConfig;
