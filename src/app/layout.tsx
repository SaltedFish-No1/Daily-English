/**
 * @author SaltedFish-No1
 * @description 应用根布局，配置全局字体、元数据、Provider 及 AppShell。
 */
import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather, Geist } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { AppShell } from '@/components/AppShell';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Analytics } from '@vercel/analytics/next';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const merriweather = Merriweather({
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-merriweather',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '薄荷外语',
  applicationName: '薄荷外语',
  description: '每日沉浸式互动体验，轻松掌握地道外语表达。',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/image.png', sizes: '768x768', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: '薄荷外语',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={cn(
        inter.variable,
        merriweather.variable,
        'font-sans',
        geist.variable
      )}
    >
      <body className="antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Toaster
          position="bottom-center"
          className="lg:!top-4 lg:!right-4 lg:!bottom-auto lg:!left-auto"
          toastOptions={{ duration: 3000 }}
        />
      </body>
    </html>
  );
}
