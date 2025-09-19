/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // App Router is default; ensure Node runtime for in-memory store reliability
    serverComponentsExternalPackages: [],
  },
}

export default nextConfig
