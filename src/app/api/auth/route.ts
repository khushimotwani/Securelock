import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getDb } from '@/lib/db';
import { analyzePayload } from '@/lib/ai';
import { detectThreat, sanitizeErrorMessage, safeTruncate } from '@/lib/threat-detector';
import type { ThreatSeverity } from '@/lib/threat-detector';

export const dynamic = 'force-dynamic';

/**
 * PASTA Stage 3 — Application Decomposition: Authentication Endpoint
 * 
 * SECURE DESIGN PRINCIPLES:
 * - Fail-Secure: All errors return generic messages (no stack traces, no DB info)
 * - Complete Mediation: Every request goes through rate-limit → threat-detect → AI → parameterized query
 * - Defense in Depth: 4 layers of protection before DB access
 * - Least Privilege: DB query only reads, never writes
 * - Economy of Mechanism: Simple, auditable request flow
 */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  // Layer 0: Per-IP isolation + DDoS global lockdown
  const blocked = store.isBlocked(ip);
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

    // Layer 1: Rate Limiting
    if (!store.checkRateLimit(ip, userAgent)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Layer 2: Payload size constraint (prevents buffer exhaustion)
    const rawBody = await req.text();
    if (rawBody.length > 800) {
      return NextResponse.json(
        { error: 'Request payload exceeds maximum allowed size.' },
        { status: 413 }
      );
    }

    // Safe JSON parse with fail-secure
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
    }

    const username = typeof parsed.username === 'string' ? parsed.username : '';
    const password = typeof parsed.password === 'string' ? parsed.password : '';
    const secureMode = parsed.secureMode !== false; // Default: true (Fail-Secure)

    // Input length validation (prevents numeric/memory abuse)
    if (username.length > 128 || password.length > 128) {
      return NextResponse.json(
        { error: 'Credential fields exceed maximum length.' },
        { status: 400 }
      );
    }

    // Layer 3: Static Threat Detection (DREAD-scored)
    const usernameThreat = detectThreat(username, 'username');
    const passwordThreat = detectThreat(password, 'password');
    const threat = usernameThreat.detected ? usernameThreat : passwordThreat;

    if (threat.detected) {
      const sev = threat.severity !== 'NONE' ? threat.severity as ThreatSeverity : undefined;
      store.addLog({
        type: threat.type as 'SQL_INJECTION',
        message: `Threat blocked on auth endpoint: ${threat.description} [DREAD: ${threat.dpiScore?.total ?? 'N/A'}]`,
        ip,
        userAgent: safeTruncate(userAgent, 80),
        severity: sev,
      });
      store.updateReputation(ip, true);

      // Tarpit: exhaust attacker's connection pool
      await new Promise(resolve => setTimeout(resolve, 5000));

      return NextResponse.json(
        { error: 'Request blocked by security policy.' },
        { status: 400 }
      );
    }

    // Layer 4: AI-Powered Threat Detection
    if (store.isDetectionActive()) {
      const evaluation = await analyzePayload(
        `Username: ${safeTruncate(username, 50)} | Password: [REDACTED]`,
        'SQL Authentication Credentials Layer'
      );

      if (evaluation.isMalicious) {
        store.addLog({
          type: 'SQL_INJECTION',
          message: `Sentinel AI blocked login (Confidence: ${evaluation.confidence}%)`,
          ip,
          userAgent: safeTruncate(userAgent, 80),
          aiReasoning: evaluation.reasoning,
        });
        store.updateReputation(ip, true);
        await new Promise(resolve => setTimeout(resolve, 5000));

        return NextResponse.json(
          { error: 'Request blocked by security policy.' },
          { status: 400 }
        );
      }
    }

    // Layer 5: Database Query — Always parameterized by default
    const db = await getDb();
    let userRecord;

    if (secureMode) {
      userRecord = await db.get(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
      );
    } else {
      // DEMO LAB ONLY — kept for educational demonstration
      const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
      try {
        userRecord = await db.get(query);
      } catch {
        return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
      }
    }

    // Authentication decision — no information leakage about why login failed
    if (userRecord) {
      const isSuccessfulBypass = userRecord.username === 'admin' && password !== 'admin123';

      store.addLog({
        type: 'NORMAL',
        message: isSuccessfulBypass
          ? `CRITICAL: Auth bypassed via injection. User: ${safeTruncate(String(userRecord.username), 30)}`
          : `Successful login: ${safeTruncate(String(userRecord.username), 30)}`,
        ip,
        userAgent: safeTruncate(userAgent, 80),
      });
      store.updateReputation(ip, false);

      return NextResponse.json({
        success: true,
        message: isSuccessfulBypass ? 'CRITICAL: Auth Bypassed!' : 'Login successful',
      });
    } else {
      store.addLog({
        type: 'LOGIN_ATTEMPT',
        message: `Failed login for: ${safeTruncate(username, 30)}`,
        ip,
        userAgent: safeTruncate(userAgent, 80),
      });
      // Generic error — does not reveal whether username exists (prevents user enumeration)
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

  } catch (e) {
    // Fail-secure: never leak internal errors to client
    const err = e instanceof Error ? e : new Error('Unknown');
    console.error('Auth error:', sanitizeErrorMessage(err.message));
    return NextResponse.json({ error: 'An error occurred.' }, { status: 400 });
  }
}
