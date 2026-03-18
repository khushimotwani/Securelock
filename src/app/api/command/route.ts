import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { exec } from 'child_process';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  if (store.isLockedDown()) {
    return NextResponse.json(
      { error: 'System is locked down. Requests blocked.' },
      { status: 403 }
    );
  }

  try {
    const { cmd } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Simulated detection module for malicious command patterns
    const maliciousPatterns = /[;&|`$\\]|(?:(?:\.\.\/)+)|(?:wget|curl|nc|bash|sh|powershell|cmd)/i;
    // Detection module for XSS / Input Validation weaknesses
    const xssPatterns = /(?:<script.*?>.*?<\/script>)|(?:<.*?on\w+.*?=.*?>)|(?:javascript:)/i;
    
    const isDetectionActive = store.isDetectionActive();

    if (isDetectionActive) {
      if (xssPatterns.test(cmd)) {
        store.addLog({
          type: 'XSS_INJECTION',
          message: `Cross-Site Scripting (XSS) payload detected: "${cmd}"`,
          ip,
        });
        return NextResponse.json(
          { error: 'XSS attack signature detected and blocked by SecureLockTS Sentinel Engine. Input validation enforced.' },
          { status: 400 }
        );
      }
      
      if (maliciousPatterns.test(cmd)) {
        store.addLog({
          type: 'COMMAND_INJECTION',
          message: `Command injection attempt detected: "${cmd}"`,
          ip,
        });
        return NextResponse.json(
          { error: 'Malicious OS payload detected and blocked by SecureLockTS Sentinel Engine. Try disabling the Engine to see the raw vulnerability in action.' },
          { status: 400 }
        );
      }
    }

    // ACTUAL VULNERABLE EXECUTION
    // If detection is off, or if it's a safe command, we run it!
    let output = '';
    const isSafe = /^[a-zA-Z0-9\s.\-]+$/.test(cmd);

    if (!isDetectionActive || isSafe) {
       try {
           const { stdout, stderr } = await execAsync(cmd, { timeout: 5000 });
           output = stdout || stderr || 'Command executed empty result.';
       } catch(e: any) {
           output = e.stdout || e.stderr || e.message || 'Execution error.';
       }
    } else {
        output = 'Command not permitted or unrecognized.';
    }

    store.addLog({
      type: 'NORMAL',
      message: `Executed command safely: "${cmd}"`,
      ip,
    });

    return NextResponse.json({ success: true, output });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
