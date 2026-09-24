/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ["app", "components", "hooks", "lib", "convex"],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
