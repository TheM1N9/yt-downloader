/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable standalone output for Docker
  output: "standalone",
};

export default nextConfig;
