/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['maps.googleapis.com', 'lh3.googleusercontent.com'],
    unoptimized: true,
  },
}

export default nextConfig
