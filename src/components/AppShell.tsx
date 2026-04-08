'use client';

/**
 * @author SaltedFish-No1
 * @description 应用外壳组件，根据当前路由控制导航栏显隐和桌面端侧边栏偏移。
 */
import { usePathname } from 'next/navigation';
import { AppNavBar, DesktopSidebar } from './AppNavBar';

/** Pages where the global nav should be hidden entirely */
const HIDE_NAV_ROUTES = ['/login', '/auth/callback', '/intro', '/review/swipe'];

/** Pages where the desktop sidebar offset should NOT be applied (lesson pages have their own layout) */
function shouldApplyDesktopOffset(pathname: string) {
  return (
    !pathname.startsWith('/lessons/') && !pathname.startsWith('/review/swipe')
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.includes(pathname);
  const desktopOffset = !hideNav && shouldApplyDesktopOffset(pathname);

  return (
    <>
      {!hideNav && <DesktopSidebar />}
      <div className={desktopOffset ? 'lg:pl-20' : ''}>{children}</div>
      {!hideNav && <AppNavBar />}
    </>
  );
}
