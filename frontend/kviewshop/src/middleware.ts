import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale } from '@/lib/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle shop routes (/@username) - these should work without locale prefix
  if (pathname.startsWith('/@')) {
    // Redirect to default locale shop route
    const username = pathname.slice(2);
    return NextResponse.redirect(
      new URL(`/${defaultLocale}/@${username}`, request.url)
    );
  }

  // Update Supabase session
  const { supabaseResponse, user } = await updateSession(request);

  // Protected routes - require authentication
  const protectedPaths = ['/admin', '/brand', '/creator'];
  const isProtectedRoute = protectedPaths.some((path) => {
    const localePattern = new RegExp(`^/(en|ja|ko)${path}`);
    return localePattern.test(pathname);
  });

  if (isProtectedRoute && !user) {
    // Redirect to login with return URL
    const locale = pathname.split('/')[1] || defaultLocale;
    const returnUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/${locale}/login?returnUrl=${returnUrl}`, request.url)
    );
  }

  // Role-based access control
  if (user) {
    const userMetadata = user.user_metadata;
    const userRole = userMetadata?.role;

    // Admin routes - only super_admin
    if (pathname.match(/^\/(en|ja|ko)\/admin/) && userRole !== 'super_admin') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Brand routes - only brand_admin
    if (pathname.match(/^\/(en|ja|ko)\/brand/) && userRole !== 'brand_admin') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Creator routes - only creator
    if (pathname.match(/^\/(en|ja|ko)\/creator/) && userRole !== 'creator') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // Apply i18n middleware
  const response = intlMiddleware(request);

  // Copy cookies from supabase response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files
    // - _next
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
