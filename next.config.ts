import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./lib/generated/prisma/**/*"],
    "/*": ["./lib/generated/prisma/**/*"],
  },
};

export default nextConfig;
