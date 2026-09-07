import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['libsql', 'better-sqlite3'],
};

export default nextConfig;
