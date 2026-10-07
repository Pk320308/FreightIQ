/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  swcMinify: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false; // Disable corrupting packfile cache in dev mode
    }
    config.ignoreWarnings = [
      { module: /@supabase\/realtime-js/ },
      /Critical dependency/,
      /PackFileCacheStrategy/,
      /ENOENT: no such file or directory/,
    ];
    return config;
  },
};

module.exports = nextConfig;
