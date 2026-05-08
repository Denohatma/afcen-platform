import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/*": ["./lib/generated/prisma/*.node", "./lib/generated/prisma/*.so.node"],
  },
};

export default nextConfig;
