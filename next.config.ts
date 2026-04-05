import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withSentryConfig(withPWA(nextConfig), {
  // Suppress source map upload logs in CI
  silent: true,
  // Upload source maps for better stack traces
  widenClientFileUpload: true,
});
