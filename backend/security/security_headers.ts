import { NextResponse } from 'next/server';

/**
 * Enterprise Security Headers (OWASP & SIH Compliance)
 * Protects against XSS, Clickjacking, MIME-sniffing, and MITM attacks.
 */
export function applySecurityHeaders(res: NextResponse): NextResponse {
  // 1. Prevent MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // 2. Prevent Clickjacking (iframe embedding)
  res.headers.set('X-Frame-Options', 'DENY');

  // 3. Enable legacy XSS filter protection
  res.headers.set('X-XSS-Protection', '1; mode=block');

  // 4. Strict Referrer Policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Strict Transport Security (HSTS)
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 6. Permissions Policy
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // 7. Content Security Policy (CSP)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.tile.openstreetmap.org https://unpkg.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co http://localhost:8000 http://127.0.0.1:8000",
    "frame-ancestors 'none'",
  ].join('; ');

  res.headers.set('Content-Security-Policy', cspHeader);

  return res;
}
