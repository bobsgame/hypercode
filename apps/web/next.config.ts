import type { NextConfig } from "next";

// Prevent Next.js from clearing the console
console.clear = () => { };

const nextConfig: NextConfig = {
  transpilePackages: ["@borg/ui", "@borg/core"],
};

export default nextConfig;
