import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shim = path.join(__dirname, "src/lib/markets/shims/empty.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@alchemy/aa-core": shim,
      "@alchemy/aa-alchemy": shim,
      "@account-kit/infra": shim,
      "@account-kit/wallet-client": shim,
    };
    return config;
  },
};

export default nextConfig;
