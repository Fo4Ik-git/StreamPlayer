import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Разрешает любые домены
      },
      {
        protocol: 'http',
        hostname: '**', // Разрешает http, если нужно для тестов
      },
    ],
  },
};

export default nextConfig;