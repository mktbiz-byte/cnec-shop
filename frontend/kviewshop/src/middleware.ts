import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale, localePattern } from '@/lib/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// Build regex patterns dynamically from config
const LP = localePattern; // e.g. "en|ja|ko|es|it|ru|ar|zh|fr|pt|de"
const loginPageRegex = new RegExp(`^/(${LP})/(brand|creator|buyer)/login`);
const signupPageRegex = new RegExp(`^/(${LP})/(buyer)/signup`);
const adminRouteRegex = new RegExp(`^/(${LP})/admin`);
const brandRouteRegex = new RegExp(`^/(${LP})/brand`);
const creatorRouteRegex = new RegExp(`^/(${LP})/creator`);
const buyerRouteRegex = new RegExp(`^/(${LP})/buyer`);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle shop routes (/@username) - rewrite to /username (strip @)
  const shopRouteRegex = new RegExp(`^/(${LP})/@([a-zA-Z0-9_]+)(.*)$`);
  const shopMatch = pathname.match(shopRouteRegex);
  if (shopMatch) {
    const locale = shopMatch[1];
    const username = shopMatch[2];
    const rest = shopMatch[3] || '';
    const newUrl = new URL(`/${locale}/${username}${rest}`, request.url);
    return NextResponse.rewrite(newUrl);
  }

  // Handle /@username without locale prefix - redirect to default locale
  if (pathname.startsWith('/@')) {
    const rest = pathname.slice(2);
    return NextResponse.redirect(
      new URL(`/${defaultLocale}/${rest}`, request.url)
    );
  }

  // Update Supabase session
  const { supabaseResponse, user } = await updateSession(request);

  // Login/signup pages should be accessible without authentication
  const isLoginPage = loginPageRegex.test(pathname);
  const isSignupPage = signupPageRegex.test(pathname);
  const isPublicAuthPage = isLoginPage || isSignupPage;

  // Protected routes - require authentication (exclude login/signup pages)
  const protectedPaths = ['/admin', '/brand', '/creator', '/buyer'];
  const isProtectedRoute = !isPublicAuthPage && protectedPaths.some((path) => {
    const pattern = new RegExp(`^/(${LP})${path}`);
    return pattern.test(pathname);
  });

  if (isProtectedRoute && !user) {
    // Redirect to appropriate login with return URL
    const locale = pathname.split('/')[1] || defaultLocale;
    const returnUrl = encodeURIComponent(pathname);

    // Redirect buyer routes to buyer login, others to general login
    if (buyerRouteRegex.test(pathname)) {
      return NextResponse.redirect(
        new URL(`/${locale}/buyer/login?returnUrl=${returnUrl}`, request.url)
      );
    }
    return NextResponse.redirect(
      new URL(`/${locale}/login?returnUrl=${returnUrl}`, request.url)
    );
  }

  // Role-based access control (exclude login/signup pages)
  if (user && !isPublicAuthPage) {
    const userMetadata = user.user_metadata;
    const userRole = userMetadata?.role;

    // Admin routes - only super_admin
    if (adminRouteRegex.test(pathname) && userRole !== 'super_admin') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Brand routes - only brand_admin
    if (brandRouteRegex.test(pathname) && userRole !== 'brand_admin') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Creator routes - only creator
    if (creatorRouteRegex.test(pathname) && userRole !== 'creator') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Buyer routes - only buyer
    if (buyerRouteRegex.test(pathname) && userRole !== 'buyer') {
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
