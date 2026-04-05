import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase-middleware';

/** 无需登录即可访问的页面路径（白名单） */
const PUBLIC_PATHS = ['/login', '/intro', '/reset-password'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  const supabase = createSupabaseMiddlewareClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未登录用户访问非公开路由 → 重定向到产品介绍页
  if (!user && !isPublicRoute(pathname)) {
    const introUrl = request.nextUrl.clone();
    introUrl.pathname = '/intro';
    introUrl.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(introUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // 已登录用户访问登录页或介绍页 → 重定向到首页
  if (user && (pathname === '/login' || pathname === '/intro')) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    const redirectResponse = NextResponse.redirect(homeUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (images, icons, etc.)
     * - API routes (protected by their own auth logic)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest|webmanifest)$|api/).*)',
  ],
};
