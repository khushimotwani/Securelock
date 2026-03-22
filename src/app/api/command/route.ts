import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { exec } from 'child_process';
import { promisify } from 'util';
import { analyzePayload } from '@/lib/ai';

export const dynamic = 'force-dynamic';
const execAsync = promisify(exec);

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // ---------------------------------------------------------------------------------
  // PSYCHOLOGICAL WARFARE: RICKROLL BANNED IPs
  // ---------------------------------------------------------------------------------
  if (store.isBanned(ip)) {
     return NextResponse.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 302);
  }

  if (store.isLockedDown()) {
    return NextResponse.json(
      { error: 'System is locked down. API requests are blocked at the server level (403 Forbidden).' },
      { status: 403 }
    );
  }

  try {
    const userAgent = req.headers.get('user-agent') || 'Unknown Origin';

    // ---------------------------------------------------------------------------------
    // RATE LIMITING & DDOS PREVENTION
    // ---------------------------------------------------------------------------------
    if (!store.checkRateLimit(ip, userAgent)) {
      return NextResponse.json(
        { error: '429 Too Many Requests. Network velocity limits breached. Traffic dropped.' },
        { status: 429 }
      );
    }

    // ---------------------------------------------------------------------------------
    // PAYLOAD SIZE CONSTRAINTS (Preventing Buffer Exhaustion)
    // ---------------------------------------------------------------------------------
    const rawBody = await req.text();
    if (rawBody.length > 500) {
      return NextResponse.json(
        { error: '413 Payload Too Large. Sentinel Edge Constraint Violated.' },
        { status: 413 }
      );
    }

    const { cmd, secureMode = false } = JSON.parse(rawBody);
    const isDetectionActive = store.isDetectionActive();

    // ---------------------------------------------------------------------------------
    // AI-POWERED THREAT DETECTION (SENTINEL LLM)
    // ---------------------------------------------------------------------------------
    if (isDetectionActive) {
      const evaluation = await analyzePayload(cmd, "OS Diagnostic Shell Command Extractor");
      
      if (evaluation.isMalicious) {
        store.addLog({
          type: 'COMMAND_INJECTION',
          message: `Sentinel AI intercepted dangerous shell payload: "${cmd}" (Confidence: ${evaluation.confidence}%)`,
          ip,
          userAgent,
          aiReasoning: evaluation.reasoning,
        });
        
        // ---------------------------------------------------------------------------------
        // TARPIT ACTIVE DEFENSE (Starve the Attacker's Threads)
        // ---------------------------------------------------------------------------------
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return NextResponse.json(
          { error: `AI Intervention: Blocked OS command execution. Reason: ${evaluation.reasoning}` },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------------------------------------------
    // COMMAND EXECUTION
    // ---------------------------------------------------------------------------------
    let output = '';

    if (secureMode) {
      const isPingSafe = /^ping\s+[a-zA-Z0-9.\-]+$/.test(cmd);
      if (isPingSafe) {
        try {
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
      try {
        const { stdout, stderr } = await execAsync(cmd, { timeout: 5000 });
        output = stdout || stderr || 'Command executed empty result.';
      } catch (e: unknown) {
        const err = e as Error;
        const sysErr = e as {stdout?: string, stderr?: string};
        output = sysErr.stdout || sysErr.stderr || err.message;
      }
    }

    store.addLog({
      type: 'NORMAL',
      message: `Executed OS command: "${cmd.substring(0, 50)}${cmd.length > 50 ? '...' : ''}"`,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, output });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
