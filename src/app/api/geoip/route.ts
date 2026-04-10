import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^localhost$/i,
  /^0\.0\.0\.0$/,
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ip = url.searchParams.get('ip') || '';

  if (!ip || PRIVATE_IP_RANGES.some(r => r.test(ip))) {
    // Return simulated geo for private/localhost IPs (for demo purposes)
    const demoLocations = [
      { country: 'Russia', countryCode: 'RU', lat: 55.75, lon: 37.62 },
      { country: 'China', countryCode: 'CN', lat: 39.92, lon: 116.39 },
      { country: 'United States', countryCode: 'US', lat: 37.09, lon: -95.71 },
      { country: 'Brazil', countryCode: 'BR', lat: -14.24, lon: -51.93 },
      { country: 'Germany', countryCode: 'DE', lat: 51.17, lon: 10.45 },
      { country: 'India', countryCode: 'IN', lat: 20.59, lon: 78.96 },
      { country: 'North Korea', countryCode: 'KP', lat: 40.34, lon: 127.51 },
      { country: 'Iran', countryCode: 'IR', lat: 32.43, lon: 53.69 },
    ];
    const demo = demoLocations[Math.floor(Math.random() * demoLocations.length)];
    return NextResponse.json(demo);
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return NextResponse.json(null);
    const data = await res.json();
    if (data.status !== 'success') return NextResponse.json(null);
    return NextResponse.json({
      country: data.country,
      countryCode: data.countryCode,
      lat: data.lat,
      lon: data.lon,
    });
  } catch {
    return NextResponse.json(null);
  }
}
