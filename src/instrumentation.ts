/**
 * @author SaltedFish-No1
 * @description Next.js Instrumentation 钩子，在服务端启动时初始化 Sentry。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = async (...args: unknown[]) => {
  const Sentry = await import('@sentry/nextjs');
  return (Sentry.captureRequestError as (...a: unknown[]) => void)(...args);
};
