/**
 * @author SaltedFish-No1
 * @description 客户端 Instrumentation 入口，初始化 Sentry 浏览器端错误监控。
 */
import * as Sentry from '@sentry/nextjs';
import { clientEnv } from '@/lib/env/client';

Sentry.init({
  dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring: sample 20% of transactions
  tracesSampleRate: 0.2,

  // Capture 100% of sessions with errors for replay debugging
  replaysOnErrorSampleRate: 1.0,
  // Sample 10% of normal sessions for replay
  replaysSessionSampleRate: 0.1,

  integrations: [Sentry.replayIntegration()],
});
