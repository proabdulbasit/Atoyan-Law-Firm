import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/fonts/**/*", "./public/images/**/*"],
  },
};

export default nextConfig;
