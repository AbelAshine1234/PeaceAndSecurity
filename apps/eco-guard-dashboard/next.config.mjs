/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force new deployment
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  output: "standalone",
  experimental: {
  },
}

export default nextConfig;
