import type { NextConfig } from "next";

// Prevent Next.js from clearing the console
console.clear = () => { };

const nextConfig: NextConfig = {
  transpilePackages: ["@borg/ui"],
  serverExternalPackages: [
    "better-sqlite3",
    "hyperswarm",
    "onnxruntime-node",
    "@lancedb/lancedb",
    "@lancedb/lancedb-win32-x64-msvc",
    "udx-native",
    "vectordb",
    "sharp"
  ],
};

export default nextConfig;
