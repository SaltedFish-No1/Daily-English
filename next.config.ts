import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/Daily-English' : '';
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: !isProd,
  scope: isProd ? '/Daily-English/' : '/',
});

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  turbopack: {},
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
