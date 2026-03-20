import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { exec } from 'child_process';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  if (store.isLockedDown()) {
    return NextResponse.json(
      { error: 'System is locked down. API requests are blocked at the server level (403 Forbidden).' },
      { status: 403 }
    );
  }

  try {
    const { cmd, secureMode = false } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // ---------------------------------------------------------------------------------
    // SERVER-SIDE ATTACK DETECTION (WAF)
    // ---------------------------------------------------------------------------------
    const isDetectionActive = store.isDetectionActive();

    if (isDetectionActive) {
      const maliciousPatterns = /[;&|`$\\]|(?:(?:\.\.\/)+)|(?:wget|curl|nc|bash|sh|powershell|cmd)/i;
      const xssPatterns = /(?:<script.*?>.*?<\/script>)|(?:<.*?on\w+.*?=.*?>)|(?:javascript:)/i;
      
      if (xssPatterns.test(cmd)) {
        store.addLog({
          type: 'XSS_INJECTION',
          message: `Sentinel intercepted XSS payload: "${cmd}"`,
          ip,
        });
        return NextResponse.json(
          { error: 'XSS attack signature detected and blocked by Sentinel Engine.' },
          { status: 400 }
        );
      }
      
      if (maliciousPatterns.test(cmd)) {
        store.addLog({
          type: 'COMMAND_INJECTION',
          message: `Sentinel intercepted Command injection attempt: "${cmd}"`,
          ip,
        });
        return NextResponse.json(
          { error: 'Malicious OS payload detected and blocked by Sentinel Engine.' },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------------------------------------------
    // COMMAND EXECUTION
    // ---------------------------------------------------------------------------------
    let output = '';

    if (secureMode) {
      // SECURE IMPLEMENTATION (For Report Comparison)
      // Strictly validates that only certain commands with alphanumeric arguments run.
      // E.g. allowing ONLY "ping" command.
      const isPingSafe = /^ping\s+[a-zA-Z0-9.\-]+$/.test(cmd);
      if (isPingSafe) {
        try {
          // You could also use execFile('ping', [arg]) for further security
          const { stdout, stderr } = await execAsync(cmd, { timeout: 5000 });
          output = stdout || stderr || 'Command executed empty result.';
        } catch (e: unknown) {
          const err = e as Error;
          const sysErr = e as {stdout?: string, stderr?: string};
          output = sysErr.stdout || sysErr.stderr || err.message || 'Execution error.';
        }
      } else {
        output = 'Strict Execution Policy: Only alphanumeric ping arguments permitted in SecureMode.';
      }
    } else {
      // VULNERABLE IMPLEMENTATION (Default)
      // Directly passes unfiltered user input to the shell engine.
      // CWE-78: Improper Neutralization of Special Elements used in an OS Command
      try {
        const { stdout, stderr } = await execAsync(cmd, { timeout: 5000 });
        output = stdout || stderr || 'Command executed empty result.';
      } catch (e: unknown) {
        // Relaying exact raw OS errors, proving real local execution!
        const err = e as Error;
        const sysErr = e as {stdout?: string, stderr?: string};
        output = sysErr.stdout || sysErr.stderr || err.message;
      }
    }

    store.addLog({
      type: 'NORMAL',
      message: `Executed OS command: "${cmd.substring(0, 50)}${cmd.length > 50 ? '...' : ''}"`,
      ip,
    });

    return NextResponse.json({ success: true, output });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
