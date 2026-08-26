import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb"],
  compress: true,
  reactStrictMode: false,
  poweredByHeader: false,
};

export default nextConfig;
