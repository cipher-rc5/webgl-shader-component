/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: false },
  cacheComponents: true,
  experimental: { optimizePackageImports: ['lucide-react'] },
  compiler: { removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false }
};

export default nextConfig;
