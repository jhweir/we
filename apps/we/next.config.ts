import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       fs: false,
  //       path: false,
  //       os: false,
  //     };
  //   }
  //   return config;
  // },
  // transpilePackages: ['@we/elements'],
  // webpack: (config) => {
  //   // Make sure symlinks are handled properly
  //   config.resolve.symlinks = false;
  //   return config;
  // },
};

export default nextConfig;
