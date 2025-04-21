import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    urlImports: ['https://cdn.jsdelivr.net/'],
  },
};

export default nextConfig;
