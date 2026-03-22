import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. HTTP Verb Filtering
  // Only permit valid REST operations. Block TRACE, TRACK, etc.
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'];
  if (!allowedMethods.includes(request.method)) {
    return new NextResponse(
      JSON.stringify({ error: 'Method Not Allowed. Sentinel Edge WAF Intercept.' }),
      { status: 405, headers: { 'content-type': 'application/json' } }
    );
  }

  // 2. Strict URL Encoding Validation
  // If a URL fails decoding, it's often a sign of a malformed attack payload.
  try {
    decodeURIComponent(request.nextUrl.pathname);
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: 'Bad Request. Malformed URL Encoding.' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  // 3. Size Constraints on the URL length (Mitigating Buffer Exhaustion via huge URLs)
  if (request.nextUrl.pathname.length > 2000) {
    return new NextResponse(
      JSON.stringify({ error: 'URI Too Long. Sentinel Edge WAF Intercept.' }),
      { status: 414, headers: { 'content-type': 'application/json' } }
    );
  }

  // Pass through legitimate traffic
  const response = NextResponse.next();
  
  // Custom tracking ID to showcase self-awareness
  response.headers.set('x-sentinel-trace-id', crypto.randomUUID());
  return response;
}

export const config = {
  // Ensure the WAF runs against API endpoints and critical paths
  matcher: [
    '/api/:path*',
    '/login',
    '/test-injection',
  ],
};
