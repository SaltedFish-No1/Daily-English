import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring: sample 20% of transactions
  tracesSampleRate: 0.2,

  // Capture 100% of sessions with errors for replay debugging
  replaysOnErrorSampleRate: 1.0,
  // Sample 10% of normal sessions for replay
  replaysSessionSampleRate: 0.1,

  integrations: [Sentry.replayIntegration()],
});
