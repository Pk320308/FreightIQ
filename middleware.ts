import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/backend/security/security_headers';
import { checkRateLimit } from '@/backend/security/rate_limiter';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';

  // 1. Rate Limiting on API Endpoints only
  if (pathname.startsWith('/api/')) {
    const rateLimit = checkRateLimit(ip, 180, 60000);
    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again in a few moments.',
          retryAfterMs: rateLimit.reset - Date.now(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // 2. Fast pass-through for Next.js internal prefetch requests
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 3. Apply Security Headers to standard HTML page responses
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and internal Next assets
     */
    '/((?!_next/static|_next/image|_next/data|images|favicon.ico).*)',
  ],
};
