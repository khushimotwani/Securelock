import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { store } from '@/lib/store';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import { analyzePayload } from '@/lib/ai';
import { detectThreat, sanitizeErrorMessage, safeTruncate } from '@/lib/threat-detector';
import type { ThreatSeverity } from '@/lib/threat-detector';

export const dynamic = 'force-dynamic';
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

/**
 * PASTA Stage 3 — Application Decomposition: Command Execution Endpoint
 * 
 * SECURE DESIGN PRINCIPLES:
 * - Least Privilege: Only 5 whitelisted diagnostic commands allowed
 * - Defense in Depth: Static detection → AI detection → whitelist → execFile (no shell)
 * - Fail-Secure: Unknown commands are rejected, not executed
 * - Economy of Mechanism: Binary path hardcoded, no PATH lookup
 * - Separation of Privilege: secureMode flag separates demo from production
 */

// Strict whitelist — Least Privilege principle
const ALLOWED_COMMANDS: Record<string, { binary: string; validator: RegExp; maxArgs: number }> = {
  ping:     { binary: '/sbin/ping',     validator: /^ping\s+[a-zA-Z0-9.\-]+(\s+-c\s+\d{1,2})?$/, maxArgs: 3 },
  hostname: { binary: '/bin/hostname',  validator: /^hostname$/,                                   maxArgs: 0 },
  date:     { binary: '/bin/date',      validator: /^date$/,                                       maxArgs: 0 },
  uptime:   { binary: '/usr/bin/uptime', validator: /^uptime$/,                                    maxArgs: 0 },
  uname:    { binary: '/usr/bin/uname', validator: /^uname(\s+-[a-z]+)?$/,                        maxArgs: 1 },
};

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
    if (rawBody.length > 500) {
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

    const cmd = typeof parsed.cmd === 'string' ? parsed.cmd : '';
    const secureMode = parsed.secureMode !== false; // Default: true

    // Input length validation
    if (cmd.length > 200 || cmd.length === 0) {
      return NextResponse.json(
        { error: 'Command must be between 1 and 200 characters.' },
        { status: 400 }
      );
    }

    // Layer 1: Static Threat Detection (DREAD-scored)
    const threat = detectThreat(cmd, 'command');
    if (threat.detected) {
      const sev = threat.severity !== 'NONE' ? threat.severity as ThreatSeverity : undefined;
      store.addLog({
        type: threat.type as 'COMMAND_INJECTION',
        message: `Threat blocked on command endpoint: ${threat.description} [DREAD: ${threat.dpiScore?.total ?? 'N/A'}]`,
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
      const evaluation = await analyzePayload(cmd, 'OS Diagnostic Shell Command');

      if (evaluation.isMalicious) {
        store.addLog({
          type: 'COMMAND_INJECTION',
          message: `Sentinel AI blocked command: "${safeTruncate(cmd, 40)}" (${evaluation.confidence}%)`,
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

    // Layer 3: Command Execution
    let output = '';

    if (secureMode) {
      // PRODUCTION: Whitelist + execFile (bypasses shell entirely)
      const cmdParts = cmd.trim().split(/\s+/);
      const cmdName = cmdParts[0]?.toLowerCase();
      const allowedCmd = ALLOWED_COMMANDS[cmdName];

      if (allowedCmd && allowedCmd.validator.test(cmd.trim())) {
        const args = cmdParts.slice(1);
        // Numeric safety: enforce max args to prevent argument injection
        if (args.length > allowedCmd.maxArgs) {
          output = `Too many arguments for "${cmdName}". Maximum: ${allowedCmd.maxArgs}`;
        } else {
          try {
            const { stdout, stderr } = await execFileAsync(
              allowedCmd.binary, args,
              { timeout: 5000, maxBuffer: 1024 * 64 } // 64KB max output (memory safety)
            );
            output = stdout || stderr || 'Command executed with empty result.';
          } catch (e: unknown) {
            // Fail-secure: sanitize error output before returning
            const err = e as { stdout?: string; stderr?: string; message?: string };
            output = sanitizeErrorMessage(err.stdout || err.stderr || err.message || 'Execution error.');
          }
        }
      } else {
        output = `Execution policy violation: "${safeTruncate(cmdName || '', 20)}" is not approved. Allowed: ${Object.keys(ALLOWED_COMMANDS).join(', ')}.`;
      }
    } else {
      // DEMO LAB ONLY — kept for educational demonstration
      try {
        const { stdout, stderr } = await execAsync(cmd, { timeout: 5000, maxBuffer: 1024 * 64 });
        output = stdout || stderr || 'Command executed with empty result.';
      } catch (e: unknown) {
        const err = e as { stdout?: string; stderr?: string; message?: string };
        output = err.stdout || err.stderr || err.message || 'Execution error.';
      }
    }

    store.addLog({
      type: 'NORMAL',
      message: `Executed: "${safeTruncate(cmd, 40)}" (${secureMode ? 'Secure' : 'Vulnerable'})`,
      ip,
      userAgent: safeTruncate(userAgent, 80),
    });
    store.updateReputation(ip, false, deviceId);

    // Sanitize output before sending — prevent information leakage
    return NextResponse.json({ success: true, output: safeTruncate(output, 4096) });
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Unknown');
    console.error('Command error:', sanitizeErrorMessage(err.message));
    return NextResponse.json({ error: 'An error occurred.' }, { status: 400 });
  }
}
