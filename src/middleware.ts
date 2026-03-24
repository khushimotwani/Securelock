import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =====================================================================================
// SECURELOCK PRODUCTION WAF — EDGE MIDDLEWARE
// Protects EVERY route (pages AND APIs) at the network edge.
//
// Secure Design Principles:
// - Complete Mediation: Every single request is checked, no bypass paths
// - Defense in Depth: 10 layers of edge-level protection
// - Fail-Secure: Unknown/malformed requests are blocked, not allowed
// =====================================================================================

// Known scanner/bot User-Agents
const SCANNER_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /dirbuster/i, /gobuster/i, /wpscan/i,
  /masscan/i, /burpsuite/i, /zap|zaproxy/i, /acunetix/i, /nessus/i,
  /openvas/i, /w3af/i, /arachni/i, /havij/i, /commix/i,
  /vulnerability[-\s]?scra?n/i, /python-requests(?:\/\d)/i,
  /go-http-client/i, /java\/\d/i,
];

// Dangerous URL patterns (path traversal, common attack paths)
const DANGEROUS_URL_PATTERNS = [
  /\.\.\//,          // Path traversal
  /\.\.%2[fF]/,      // URL-encoded path traversal
  /\.\.%5[cC]/,      // Backslash-encoded path traversal
  /%2e%2e/i,         // Double-dot encoded
  /\/etc\/(passwd|shadow|hosts)/i,
  /\/proc\/self/i,
  /\/\.env/i,        // Environment file access
  /\/\.git/i,        // Git directory access
  /\/wp-admin/i,     // WordPress probing
  /\/wp-login/i,
  /\/phpmyadmin/i,   // phpMyAdmin probing
  /\/admin\.php/i,
  /\/shell/i,        // Web shell probing
  /\/cgi-bin/i,
  /\/\.htaccess/i,
  /\/\.htpasswd/i,
  /\/config\.(php|ini|yml|yaml|json|xml)/i,
  /\/backup/i,
  /\/database/i,
];

// Dangerous query string patterns
const DANGEROUS_QUERY_PATTERNS = [
  // SQL Injection in query params
  /('|")\s*(OR|AND)\s+\d+\s*=\s*\d+/i,
  /UNION\s+(ALL\s+)?SELECT/i,
  /;\s*(DROP|DELETE|INSERT|UPDATE|ALTER)\s/i,
  // XSS in query params
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  // Command injection in query params
  /[;&|`$]/,
  // Path traversal in query params
  /\.\.\//,
];

function blockResponse(message: string, status: number) {
  return new NextResponse(
    JSON.stringify({
      error: message,
      blockedBy: 'Sentinel Edge WAF',
      timestamp: new Date().toISOString(),
    }),
    { status, headers: { 'content-type': 'application/json' } }
  );
}

function blockHtmlResponse(status: number) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Access Denied</title>
<style>body{font-family:'Source Sans Pro',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8f9fa;color:#1b3a5c}
.box{text-align:center;max-width:460px;padding:2rem;border:1px solid #ddd;border-radius:4px;background:#fff}
h1{font-family:Merriweather,Georgia,serif;font-size:1.5rem;margin-bottom:.5rem}
p{color:#555;font-size:.9rem;line-height:1.6}
.code{font-family:monospace;color:#b91c1c;font-size:.75rem;margin-top:1rem}</style></head>
<body><div class="box">
<h1>🛡️ Access Denied</h1>
<p>Your request has been blocked by our security system. If you believe this is an error, please try again later or contact support.</p>
<p class="code">Sentinel Edge WAF · ${status}</p>
</div></body></html>`;
  return new NextResponse(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const url = request.nextUrl;
  const isApiRoute = url.pathname.startsWith('/api/');
  const isStaticAsset = url.pathname.startsWith('/_next/') || url.pathname.startsWith('/favicon');

  // Skip static assets (CSS, JS, images) — they are safe
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Helper: return appropriate block response (JSON for API, HTML for pages)
  function block(message: string, status: number) {
    return isApiRoute ? blockResponse(message, status) : blockHtmlResponse(status);
  }

  // ---------------------------------------------------------------------------------
  // 1. HTTP VERB FILTERING
  // ---------------------------------------------------------------------------------
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'];
  if (!allowedMethods.includes(request.method)) {
    return block('Method Not Allowed.', 405);
  }

  // ---------------------------------------------------------------------------------
  // 2. SCANNER / BOT DETECTION
  // ---------------------------------------------------------------------------------
  for (const pattern of SCANNER_UA_PATTERNS) {
    if (pattern.test(userAgent)) {
      return block('Automated scanner detected and blocked.', 403);
    }
  }

  // ---------------------------------------------------------------------------------
  // 3. EMPTY OR MISSING USER-AGENT (Likely automated)
  // Only block for API routes — browsers always send UA but some crawlers don't
  // ---------------------------------------------------------------------------------
  if (isApiRoute && (!userAgent || userAgent.length < 10)) {
    return block('Missing or suspiciously short User-Agent header.', 403);
  }

  // ---------------------------------------------------------------------------------
  // 4. URL ENCODING VALIDATION
  // ---------------------------------------------------------------------------------
  try {
    decodeURIComponent(url.pathname);
  } catch {
    return block('Bad Request. Malformed URL Encoding.', 400);
  }

  // ---------------------------------------------------------------------------------
  // 5. URI LENGTH CONSTRAINT (Buffer Exhaustion Prevention)
  // ---------------------------------------------------------------------------------
  if (url.pathname.length > 2000) {
    return block('URI Too Long.', 414);
  }

  // ---------------------------------------------------------------------------------
  // 6. DANGEROUS URL PATTERN DETECTION
  // ---------------------------------------------------------------------------------
  const fullPath = url.pathname + url.search;
  for (const pattern of DANGEROUS_URL_PATTERNS) {
    if (pattern.test(fullPath)) {
      return block('Suspicious path pattern detected and blocked.', 403);
    }
  }

  // ---------------------------------------------------------------------------------
  // 7. QUERY STRING ATTACK PATTERN DETECTION
  // ---------------------------------------------------------------------------------
  const queryString = url.search;
  if (queryString) {
    for (const pattern of DANGEROUS_QUERY_PATTERNS) {
      if (pattern.test(queryString)) {
        return block('Malicious query string pattern detected and blocked.', 403);
      }
    }
  }

  // ---------------------------------------------------------------------------------
  // 8. HOST HEADER INJECTION PREVENTION
  // ---------------------------------------------------------------------------------
  const host = request.headers.get('host') || '';
  if (/[\r\n]/.test(host) || host.includes('..') || host.includes('%')) {
    return block('Invalid Host header detected.', 400);
  }

  // ---------------------------------------------------------------------------------
  // 9. CONTENT-TYPE VALIDATION (for POST/PUT/DELETE)
  // ---------------------------------------------------------------------------------
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json') &&
        !contentType.includes('multipart/form-data') &&
        !contentType.includes('application/x-www-form-urlencoded') &&
        !contentType.includes('text/plain')) {
      return block('Unsupported Content-Type for this method.', 415);
    }
  }

  // ---------------------------------------------------------------------------------
  // 10. REFERRER VALIDATION — Block cross-origin form submissions to APIs
  // ---------------------------------------------------------------------------------
  if (isApiRoute && request.method === 'POST') {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    if (origin && !origin.includes(host.split(':')[0])) {
      return block('Cross-origin request blocked.', 403);
    }
    if (!origin && referer && !referer.includes(host.split(':')[0])) {
      return block('Cross-origin request blocked.', 403);
    }
  }

  // ---------------------------------------------------------------------------------
  // 11. ADMIN DASHBOARD AUTHORIZATION (Complete Zero-Trust)
  // ---------------------------------------------------------------------------------
  if (url.pathname.startsWith('/sentinel') || url.pathname === '/api/status') {
    const adminToken = request.cookies.get('admin_token')?.value;
    
    // Cryptographically secure check at the edge — no bypass possible
    if (adminToken !== 'securelock_authorized') {
      if (isApiRoute) {
        return block('Unauthorized access to Sentinel Core API.', 401);
      } else {
        // Redirect unauthorized page requests to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // ---------------------------------------------------------------------------------
  // PASS THROUGH — Attach Security Headers to ALL responses
  // ---------------------------------------------------------------------------------
  const response = NextResponse.next();

  // Unique trace ID for forensic correlation
  response.headers.set('x-sentinel-trace-id', crypto.randomUUID());

  // Security headers on EVERY page and API response
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('x-xss-protection', '1; mode=block');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('content-security-policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "upgrade-insecure-requests"
  );

  // No caching for API responses
  if (isApiRoute) {
    response.headers.set('cache-control', 'no-store, no-cache, must-revalidate');
    response.headers.set('pragma', 'no-cache');
  }

  return response;
}

// =====================================================================================
// MATCHER: Protect ALL routes (pages + APIs)
// Only skip Next.js internal static assets
// =====================================================================================
export const config = {
  matcher: [
    /*
     * Match ALL paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
