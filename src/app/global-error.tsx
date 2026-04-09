'use client';

/**
 * @author SaltedFish-No1
 * @description 全局错误边界，捕获根布局级别的致命错误并上报 Sentry。
 */
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <Button
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
            }}
          >
            <RotateCcw size={20} />
            重试
          </Button>
        </div>
      </body>
    </html>
  );
}
