import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { store } from '@/lib/store';
import { analyzePayload } from '@/lib/ai';
import { detectThreat, sanitizeHtml, sanitizeErrorMessage, safeTruncate } from '@/lib/threat-detector';
import type { ThreatSeverity } from '@/lib/threat-detector';

export const dynamic = 'force-dynamic';

/**
 * PASTA Stage 3 — Application Decomposition: XSS Rendering Endpoint
 * 
 * SECURE DESIGN PRINCIPLES:
 * - Fail-Secure: HTML is always escaped unless explicitly set to vulnerable mode
 * - Complete Mediation: Every input scanned before rendering
 * - Defense in Depth: 3 layers (static → AI → escape) before output
 * - Open Design: Escaping algorithm is standard, auditable HTML entity encoding
 */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const cookiesList = await cookies();
  const deviceId = cookiesList.get('sl_device_id')?.value;

  const blocked = store.isBlocked(ip, deviceId);
  if (blocked === 'banned') {
    return NextResponse.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 302);
  }
  if (blocked === 'lockdown') {
    return NextResponse.json(
      { error: 'Service temporarily unavailable due to a security event.' },
      { status: 503 }
    );
  }

  try {
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    if (!store.checkRateLimit(ip, userAgent)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > 2000) {
      return NextResponse.json(
        { error: 'Request payload exceeds maximum allowed size.' },
        { status: 413 }
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
    }

    const html = typeof parsed.html === 'string' ? parsed.html : '';
    const secureMode = parsed.secureMode !== false; // Default: true

    // Input length validation
    if (html.length > 1000 || html.length === 0) {
      return NextResponse.json(
        { error: 'HTML input must be between 1 and 1000 characters.' },
        { status: 400 }
      );
    }

    // Layer 1: Static Threat Detection (DREAD-scored)
    const threat = detectThreat(html, 'html_content');
    if (threat.detected) {
      const sev = threat.severity !== 'NONE' ? threat.severity as ThreatSeverity : undefined;
      store.addLog({
        type: threat.type as 'XSS_INJECTION',
        message: `Threat blocked on XSS endpoint: ${threat.description} [DREAD: ${threat.dpiScore?.total ?? 'N/A'}]`,
        ip,
        userAgent: safeTruncate(userAgent, 80),
        severity: sev,
      });
      store.updateReputation(ip, true, deviceId);
      await new Promise(resolve => setTimeout(resolve, 5000));

      return NextResponse.json(
        { error: 'Request blocked by security policy.' },
        { status: 400 }
      );
    }

    // Layer 2: AI-Powered Threat Detection
    if (store.isDetectionActive()) {
      const evaluation = await analyzePayload(html, 'HTML Content Rendering Pipeline');

      if (evaluation.isMalicious) {
        store.addLog({
          type: 'XSS_INJECTION',
          message: `Sentinel AI blocked XSS (${evaluation.confidence}%)`,
          ip,
          userAgent: safeTruncate(userAgent, 80),
          aiReasoning: evaluation.reasoning,
        });
        store.updateReputation(ip, true, deviceId);
        await new Promise(resolve => setTimeout(resolve, 5000));

        return NextResponse.json(
          { error: 'Request blocked by security policy.' },
          { status: 400 }
        );
      }
    }

    // Layer 3: Output Encoding
    let rendered: string;

    if (secureMode) {
      // PRODUCTION: Full HTML entity escaping — XSS impossible
      rendered = sanitizeHtml(html);
    } else {
      // DEMO LAB ONLY — kept for educational demonstration
      rendered = html;
    }

    store.addLog({
      type: 'NORMAL',
      message: `Rendered HTML (${secureMode ? 'Secure' : 'Vulnerable'}): "${safeTruncate(html, 40)}"`,
      ip,
      userAgent: safeTruncate(userAgent, 80),
    });
    store.updateReputation(ip, false, deviceId);

    return NextResponse.json({ success: true, rendered });
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Unknown');
    console.error('XSS error:', sanitizeErrorMessage(err.message));
    return NextResponse.json({ error: 'An error occurred.' }, { status: 400 });
  }
}
