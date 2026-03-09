import type { NextConfig } from "next";

const imageDomains: string[] = ["i.postimg.cc", "cryptologos.cc", "images.unsplash.com", "source.unsplash.com", "api.dicebear.com"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl);
    if (hostname && !imageDomains.includes(hostname)) {
      imageDomains.push(hostname);
    }
  } catch {
  }
}

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    domains: imageDomains,
  },
  webpack: (config) => {
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
