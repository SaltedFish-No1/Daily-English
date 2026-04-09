'use client';

/**
 * @author SaltedFish-No1
 * @description 全局错误边界，捕获根布局级别的致命错误并上报 Sentry。
 *   使用内联样式和原生 HTML 元素，因为根级崩溃时 CSS/JS 可能未加载。
 */
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            Something went wrong!
          </h2>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>
            加载页面时发生了一些错误。
          </p>
          <button
            onClick={() => reset()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '12px',
              backgroundColor: '#059669',
              padding: '12px 32px',
              fontWeight: 'bold',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ↻ 重试
          </button>
        </div>
      </body>
    </html>
  );
}
