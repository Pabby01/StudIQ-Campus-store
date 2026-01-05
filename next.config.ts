import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence webpack warning
  turbopack: {},

  // Webpack config for fallback (if using --webpack flag)
  webpack: (config) => {
    // Fix for WalletConnect libraries
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },
};

export default nextConfig;
