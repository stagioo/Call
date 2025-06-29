/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  experimental: {
    serverComponentsExternalPackages: ["@call/db"],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:1284/api/:path*',
      },
    ];
  },
};

export default nextConfig;
