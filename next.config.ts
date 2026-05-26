import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Fix pdf-parse di Vercel serverless
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
